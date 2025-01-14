'use client'

import { Container, Heading } from '@chakra-ui/react'
import { useParams } from 'next/navigation'

export default function DAOPage() {
  const params = useParams()
  const daoName = params.daoName as string

  return (
    <Container maxW="container.lg" py={20}>
      <Heading size="lg" mb={6}>
        {daoName}
      </Heading>
    </Container>
  )
}
