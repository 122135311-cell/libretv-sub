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

    // 修正匹配条件，同时保留 shturl.cc 过滤
    const sources = rawList.filter(item => {
      if (item.status !== "ok") return false
      if (!item.api) return false
      // 兼容带 / 和不带 / 的情况
      if (!item.api.includes("/api.php/provide/vod")) return false
      if (item.api.includes("shturl.cc")) return false
      return true
    })

    const result = {
      name: "ziyuanzhan自动过滤订阅(剔除短链)",
      version: 2,
      sources,
      liveSources: []
    }

    const response = new Response(JSON.stringify(result, null, 2), {
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*"
      }
    })
    return response
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
