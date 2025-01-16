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
  proposalCreatedBlockNumbers?: number[]
}

interface ProposalInfo {
  id: string
  proposer: string
  description: string
  blockNumber: number
}

export default function DAOPage({ params }: PageProps) {
  const [members, setMembers] = useState<string[]>([])
  const [proposals, setProposals] = useState<ProposalInfo[]>([])
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

        const provider = new JsonRpcProvider('https://sepolia.optimism.io')
        const daoContract = new Contract(dao.address, DAO_ABI, provider)
        const nftAddress = await daoContract.token()

        if (!nftAddress || !isAddress(nftAddress)) {
          throw new Error('Invalid NFT contract address returned from DAO')
        }

        const nftContract = new Contract(nftAddress, ERC721_ABI, provider)
        const [name, symbol] = await Promise.all([nftContract.name(), nftContract.symbol()])

        setNftMetadata({
          address: nftAddress,
          name,
          symbol,
        })

        const totalSupply = await nftContract.totalSupply()
        const ownerPromises = []
        for (let i = 0; i < Number(totalSupply); i++) {
          ownerPromises.push(nftContract.ownerOf(i))
        }

        const owners = await Promise.all(ownerPromises)
        const uniqueMembers = Array.from(new Set(owners))

        setMembers(uniqueMembers)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching members:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch members')
        setIsLoading(false)
      }
    }

    async function fetchProposals() {
      try {
        if (!dao.address || !isAddress(dao.address)) {
          throw new Error(`Invalid DAO address: ${dao.address}`)
        }

        if (!dao.proposalCreatedBlockNumbers || dao.proposalCreatedBlockNumbers.length === 0) {
          setProposals([])
          setIsLoadingProposals(false)
          return
        }

        const provider = new JsonRpcProvider(
          'https://optimism-sepolia.infura.io/v3/2cd8708d4b6546ba8ab1dceacc3c1447'
        )
        const gov = new Contract(dao.address, DAO_ABI, provider)
        const filter = 'ProposalCreated'

        const proposalPromises = dao.proposalCreatedBlockNumbers.map(async blockNumber => {
          const events = await gov.queryFilter(filter, blockNumber)
          // @ts-ignore
          if (events && events[0] && events[0].args) {
            return {
              // @ts-ignore
              id: events[0].args.proposalId.toString(),
              // @ts-ignore
              proposer: events[0].args.proposer,
              // @ts-ignore
              description: events[0].args.description,
              blockNumber: blockNumber,
            }
          }
          return null
        })

        const proposalResults = await Promise.all(proposalPromises)
        const validProposals = proposalResults.filter((p): p is ProposalInfo => p !== null)

        setProposals(validProposals)
        setIsLoadingProposals(false)
      } catch (err) {
        console.error('Error fetching proposals:', err)
        setErrorProposals(err instanceof Error ? err.message : 'Failed to fetch proposals')
        setIsLoadingProposals(false)
      }
    }

    fetchMembers()
    fetchProposals()
  }, [dao.address, dao.proposalCreatedBlockNumbers])

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
                {proposals.map(proposal => (
                  <Box key={proposal.id} p={3} borderWidth="1px" borderRadius="md">
                    <Text fontFamily="mono" fontSize="sm" fontWeight="bold">
                      ID: {proposal.id}
                    </Text>
                    <Text fontSize="sm">Proposer: {proposal.proposer}</Text>
                    <Text fontSize="sm" mt={1}>
                      Description: {proposal.description}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Block: {proposal.blockNumber}
                    </Text>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Box>
    </Container>
  )
}
