/**
 * 从 `wrangler kv namespace list` 的输出里取出 KV_STATUS_PAGE 的 namespace id。
 *
 * wrangler 会把 JSON 数组 pretty-print 成多行，还可能混入警告信息，
 * 所以这里先截取第一个 JSON 数组再解析，避免用 head -1 之类脆弱的方式。
 *
 * 用法: wrangler kv namespace list | node .github/scripts/kv-namespace-id.js
 */

let raw = ''

process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => (raw += chunk))
process.stdin.on('end', () => {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')

  if (start === -1 || end === -1 || end < start) {
    console.error('无法从 wrangler 输出中解析出 JSON 数组，原始输出如下：')
    console.error(raw)
    process.exit(1)
  }

  let list
  try {
    list = JSON.parse(raw.slice(start, end + 1))
  } catch (err) {
    console.error('解析 KV namespace 列表失败：' + err.message)
    console.error(raw)
    process.exit(1)
  }

  const namespace = list.find(
    (item) => typeof item.title === 'string' && item.title.includes('KV_STATUS_PAGE'),
  )

  if (!namespace) {
    console.error('没有找到 title 含 KV_STATUS_PAGE 的 KV namespace。当前列表：')
    console.error(JSON.stringify(list, null, 2))
    process.exit(1)
  }

  process.stdout.write(namespace.id)
})
