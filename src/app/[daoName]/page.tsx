import { notFound } from 'next/navigation'
import daos from '@/app/daos.json'
import { Box, Text, Heading, VStack, Container, HStack, Tag } from '@chakra-ui/react'

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
  // Find the DAO info from daos.json
  const dao = (daos as DAOInfo[]).find(d => d.name.toLowerCase() === params.daoName.toLowerCase())

  // If DAO not found, show 404
  if (!dao) {
    notFound()
  }

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
              Address
            </Text>
            <Text fontFamily="mono">{dao.address}</Text>
          </Box>

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
        </VStack>
      </Box>
    </Container>
  )
}
