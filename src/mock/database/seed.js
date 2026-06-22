import { faker } from '@faker-js/faker/locale/zh_CN'

// 设置随机种子，确保每次开发环境生成的数据一致
faker.seed(2026)

/**
 * 生成用户数据
 */
export function generateUsers(count = 5) {
  const users = []
  for (let i = 0; i < count; i++) {
    users.push({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      role: faker.helpers.arrayElement(['admin', 'editor', 'viewer']),
      createdAt: faker.date.between({ from: '2026-01-01', to: new Date() }).toISOString()
    })
  }
  return users
}
