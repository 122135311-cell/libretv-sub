export async function onRequestGet({ request }) {
  const cache = caches.default
  const cacheKey = new Request(request.url, request)
  let cachedRes = await cache.match(cacheKey)
  if (cachedRes) return cachedRes

  const upstreamUrl = "https://mylazily.github.io/ziyuanzhan/data/latest.json"
  try {
    const rawResp = await fetch(upstreamUrl, {
      cf: { cacheTtl: 120 }
    })
    if (!rawResp.ok) throw new Error(`上游状态码:${rawResp.status}`)
    const rawList = await rawResp.json()
    const arr = Array.isArray(rawList) ? rawList : []

    // 【调试：先不做过滤，原样返回前3条，看上游到底拿到什么】
    const testData = arr.slice(0,3)

    const result = {
      name: "ziyuanzhan调试",
      version: 2,
      sources: testData,
      liveSources: []
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*"
      }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: "拉取上游失败", msg: e.message }, null, 2), {
      status: 500,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    })
  }
}
