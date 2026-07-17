import { Redis } from '@upstash/redis'
export const connection = new Redis({
  url: 'https://casual-mammal-175000.upstash.io',
  token: 'gQAAAAAAAquYAAIgcDJlMmU2NzE4NzQ5MTE0MjliOTRjMjY1OGU2MGU5ZmU4Mg',
})

