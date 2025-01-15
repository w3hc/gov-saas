'use client'

import { notFound } from 'next/navigation'
import daos from '@/app/daos.json'
import { Box, Text, Heading, VStack, Container, HStack, Tag, Spinner } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Contract, JsonRpcProvider, isAddress } from 'ethers'

const DAO_ABI = [
  'function token() view returns (address)',
  'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
]

const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
]

interface PageProps {
  params: {
    daoName: string
  }
}

interface DAOInfo {
  name: string
  address: string
  networks: number[]
  isCrosschain: boolean
}

export default function DAOPage({ params }: PageProps) {
  const [members, setMembers] = useState<string[]>([])
  const [proposals, setProposals] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingProposals, setIsLoadingProposals] = useState(true)
  const [error, setError] = useState<string>('')
  const [errorProposals, setErrorProposals] = useState<string>('')
  const [nftMetadata, setNftMetadata] = useState<{
    address?: string
    name?: string
    symbol?: string
  }>({})

  const daoInfo = (daos as DAOInfo[]).find(
    d => d.name.toLowerCase() === params.daoName.toLowerCase()
  )

  if (!daoInfo) {
    notFound()
  }

  const dao: DAOInfo = daoInfo

  useEffect(() => {
    async function fetchMembers() {
      try {
        if (!dao.address || !isAddress(dao.address)) {
          throw new Error(`Invalid DAO address: ${dao.address}`)
        }

        console.log('Connecting to DAO at:', dao.address)

        const provider = new JsonRpcProvider('https://sepolia.optimism.io')

        // First, get the NFT contract address from the DAO
        const daoContract = new Contract(dao.address, DAO_ABI, provider)
        const nftAddress = await daoContract.token()
        console.log('Found NFT contract at:', nftAddress)

        if (!nftAddress || !isAddress(nftAddress)) {
          throw new Error('Invalid NFT contract address returned from DAO')
        }

        // Now connect to the NFT contract
        const nftContract = new Contract(nftAddress, ERC721_ABI, provider)

        // Get NFT metadata
        const [name, symbol] = await Promise.all([nftContract.name(), nftContract.symbol()])

        setNftMetadata({
          address: nftAddress,
          name,
          symbol,
        })
        console.log('NFT Metadata:', { name, symbol })

        // Get membership data
        const totalSupply = await nftContract.totalSupply()
        console.log('Total supply:', totalSupply.toString())

        const ownerPromises = []
        for (let i = 0; i < Number(totalSupply); i++) {
          ownerPromises.push(nftContract.ownerOf(i))
        }

        const owners = await Promise.all(ownerPromises)
        const uniqueMembers = Array.from(new Set(owners))

        console.log('Found', uniqueMembers.length, 'members')
        setMembers(uniqueMembers)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching members:', err)
        let errorMessage = 'Failed to fetch members'
        if (err instanceof Error) {
          errorMessage = err.message
        }
        setError(errorMessage)
        setIsLoading(false)
      }
    }

    async function fetchProposals() {
      try {
        if (!dao.address || !isAddress(dao.address)) {
          throw new Error(`Invalid DAO address: ${dao.address}`)
        }

        console.log('Connecting to DAO at:', dao.address)

        // const provider = new JsonRpcProvider('https://sepolia.optimism.io')
        const provider = new JsonRpcProvider(
          'https://optimism-sepolia.infura.io/v3/2cd8708d4b6546ba8ab1dceacc3c1447'
        )

        // First, get the NFT contract address from the DAO
        const gov = new Contract(dao.address, DAO_ABI, provider)

        console.log('gov contract:', gov)

        const block = daos[1].proposalCreatedBlockNumbers

        if (!block) {
          throw new Error('Invalid block number')
        }

        console.log('block:', block[0])

        const filter = 'ProposalCreated'
        const staticProposal = await gov.queryFilter(filter, block[0])
        console.log('Static proposal:', staticProposal)
        console.log('proposal ID:', staticProposal[0].args?.proposalId)

        setProposals([staticProposal[0].args?.proposalId])
        console.log('Fetching proposals done')
        setIsLoadingProposals(false)
      } catch (err) {
        console.error('Error fetching proposals:', err)
        let errorMessage = 'Failed to fetch proposals'
        if (err instanceof Error) {
          errorMessage = err.message
        }
        setErrorProposals(errorMessage)
        setIsLoadingProposals(false)
      }
    }

    fetchMembers()
    fetchProposals()
  }, [dao.address])

  return (
    <Container maxW="container.md" py={4}>
      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <VStack align="stretch" spacing={6}>
          <HStack justify="space-between">
            <Heading size="lg">{dao.name}</Heading>
            {dao.isCrosschain && <Tag colorScheme="green">Cross-chain</Tag>}
          </HStack>

          <Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              DAO Contract
            </Text>
            <Text fontFamily="mono">{dao.address}</Text>
          </Box>

          {nftMetadata.address && (
            <Box>
              <Text fontSize="sm" color="gray.500" fontWeight="medium">
                NFT Contract
              </Text>
              <Text fontFamily="mono">{nftMetadata.address}</Text>
              {nftMetadata.name && (
                <Text mt={1}>
                  {nftMetadata.name} ({nftMetadata.symbol})
                </Text>
              )}
            </Box>
          )}

          <Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              Networks
            </Text>
            <HStack spacing={2} mt={1}>
              {dao.networks.map(networkId => (
                <Tag key={networkId}>{networkId}</Tag>
              ))}
            </HStack>
          </Box>

          <Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium" mb={2}>
              Members {members.length > 0 && `(${members.length})`}
            </Text>
            {isLoading ? (
              <HStack>
                <Spinner size="sm" />
                <Text>Loading members...</Text>
              </HStack>
            ) : error ? (
              <Text color="red.500">{error}</Text>
            ) : (
              <VStack align="stretch" spacing={2}>
                {members.map(address => (
                  <Text key={address} fontFamily="mono" fontSize="sm">
                    {address}
                  </Text>
                ))}
              </VStack>
            )}
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium" mb={2}>
              Proposals {proposals.length > 0 && `(${proposals.length})`}
            </Text>
            {isLoadingProposals ? (
              <HStack>
                <Spinner size="sm" />
                <Text>Loading proposals...</Text>
              </HStack>
            ) : errorProposals ? (
              <Text color="red.500">{errorProposals}</Text>
            ) : (
              <VStack align="stretch" spacing={2}>
                {/* {proposals.map(proposalId => (
                  <Text key={proposalId} fontFamily="mono" fontSize="sm">
                    {proposalId}
                  </Text>
                ))} */}
                <Text fontFamily="mono" fontSize="sm">
                  {proposals}
                </Text>
              </VStack>
            )}
          </Box>
        </VStack>
      </Box>
    </Container>
  )
}
