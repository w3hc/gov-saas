import React from 'react'
import { Box, SimpleGrid, Text, Badge, Stack, Heading, useColorModeValue } from '@chakra-ui/react'
import Link from 'next/link'

const featuredDAOs = [
  {
    name: 'W3HC',
    description: 'We want to build integrations through mentoring and education.',
    members: 4,
    category: 'Impact',
    treasurySize: '$2.5K',
    href: '/w3hc',
  },
  {
    name: 'Test Crosschain DAO',
    description: 'Testing crosshain Gov.',
    members: 2,
    category: 'Impact',
    treasurySize: '$0',
    href: '/crosschain-gov',
  },
  {
    name: 'Your DAO?',
    description: 'A DAO with a meaningful mission statement.',
    members: 10000,
    category: 'Impact',
    treasurySize: '$42B',
    href: '/deploy',
  },
  {
    name: 'Your DAO?',
    description: 'A DAO with a meaningful mission statement.',
    members: 10000,
    category: 'Impact',
    treasurySize: '$42B',
    href: '/deploy',
  },
]

const FeaturedDAOs = () => {
  const boxBg = useColorModeValue('gray.50', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box>
      <Heading size="lg" mb={6} textAlign="center">
        Featured DAOs
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
        {featuredDAOs.map((dao, index) => (
          <Link key={index} href={dao.href} style={{ textDecoration: 'none' }}>
            <Box
              bg={boxBg}
              p={6}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
              _hover={{
                transform: 'translateY(-4px)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                borderColor: '#8c1c84',
              }}
              role="group"
            >
              <Stack spacing={3}>
                <Heading size="md" color="#8c1c84" _groupHover={{ color: '#a82f9f' }}>
                  {dao.name}
                </Heading>
                <Text fontSize="md">{dao.description}</Text>
                <Stack direction="row" spacing={4}>
                  <Badge colorScheme="purple" px={2} py={1}>
                    {dao.category}
                  </Badge>
                  <Text fontSize="sm" color="gray.500">
                    {dao.members.toLocaleString()} members
                  </Text>
                  <Text fontSize="sm" color="green.500">
                    Treasury: {dao.treasurySize}
                  </Text>
                </Stack>
              </Stack>
            </Box>
          </Link>
        ))}
      </SimpleGrid>
    </Box>
  )
}

export default FeaturedDAOs
