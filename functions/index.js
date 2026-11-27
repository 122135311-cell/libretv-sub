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
    const sources = []
    for (const item of arr) {
      if (item.status !== "ok") continue
      if (!item.api || !item.api.includes("/api.php/provide/vod")) continue
      if (item.api.includes("shturl.cc")) continue

      let isAdult = false
      const name = item.name ?? "未知源"
      const lowName = name.toLowerCase()
      if (/(av|成人|杏|骚|色情)/.test(lowName)) {
        isAdult = true
      }

      sources.push({
        name,
        url: item.api,
        detail: "",
        isAdult
      })
    }

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
