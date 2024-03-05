# Cloudflare Worker - 网站状态监控

使用 **Cloudflare Workers**、**CRON 触发器** 和 **KV 存储**，监控您的网站，展示每日历史状态，并在您的网站状态发生变化时通过 Slack/Telegram/Discord 接收通知。去原项目作者[演示站](https://status-page.eidam.dev) 瞅瞅! 🚀

![Status Page](.gitbook/assets/status_page_screenshot.png)

![Slack notifications](.gitbook/assets/slack_screenshot.png)

## 前置准备

一个[Cloudflare账号](https://dash.cloudflare.com/sign-up/workers)，并满足以下条件

- 设置一个workers域名\(部署的时候会自动生成，然后自己再配一个自定义域就好了\)
- 个人使用的话，免费账号完全够用
- 要监控的网页/API 🙂

还要以下密钥

- 具有`编辑Cloudflare Workers`权限的Cloudflare API token
- Slack incoming webhook \(可选\)
- Discord incoming webhook \(可选\)

## 开始吧

你可以使用`GitHub Actions`直接CF部署或者自行部署

### 直接CF部署

[![Deploy to Cloudflare Workers](https://camo.githubusercontent.com/1f3d0b4d44a2c3f12c78bd02bae907169430e04d728006db9f97a4befa64c886/68747470733a2f2f6465706c6f792e776f726b6572732e636c6f7564666c6172652e636f6d2f627574746f6e3f706169643d74727565)](https://deploy.workers.cloudflare.com/?url=https://github.com/eidam/cf-workers-status-page)

1. 点击上面的图片并跟随提示操作，最后你会fork得到这个仓库的复制
2. 导航到 **GitHub repository &gt; Settings &gt; Secrets** 并添加以下密钥:

   ```yaml
   - Name: CF_API_TOKEN (should be added automatically)

   - Name: CF_ACCOUNT_ID (should be added automatically)

   - Name: SECRET_SLACK_WEBHOOK_URL (optional)
   - Value: your-slack-webhook-url

   - Name: SECRET_DISCORD_WEBHOOK_URL (optional)
   - Value: your-discord-webhook-url
   ```

3. 打开你仓库的 **Actions** 页面并按提示打开自动部署开关
4. 按你需求编辑 [config.yaml](./config.yaml)

   ```yaml
   settings:
     title: 'Status Page'
     url: 'https://status-page.eidam.dev' # 这应该是推送消息要用的
     logo: logo-192x192.png # image in ./public/ folder， logo可以自定义
     daysInHistogram: 90 # 你想展示状态的天数
     collectResponseTimes: false # 实验功能, 你有钱或者监控的网站少于5个才开启

     # configurable texts across the status page
     allmonitorsOperational: 'All Systems Operational'
     notAllmonitorsOperational: 'Not All Systems Operational'
     monitorLabelOperational: 'Operational'
     monitorLabelNotOperational: 'Not Operational'
     monitorLabelNoData: 'No data'
     dayInHistogramNoData: 'No data'
     dayInHistogramOperational: 'All good'
     dayInHistogramNotOperational: 'Some checks failed'

   # list of monitors
   monitors:
     - id: workers-cloudflare-com # unique identifier
       name: workers.cloudflare.com
       description: 'You write code. They handle the rest.' # default=empty
       url: 'https://workers.cloudflare.com/' # URL to fetch
       method: GET # default=GET
       expectStatus: 200 # operational status, default=200
       followRedirect: false # should fetch follow redirects, default=false
       linkable: false # should the titles be links to the service, default=true
   ```

5. 推送到`main`分支以触发自动部署
6. 🎉
7. _\(可选\)_ 到[Cloudflare Workers 设置页面](https://dash.cloudflare.com/?to=/workers)设置自定义域或路由
   - e.g. `status-page.eidam.dev/*` _\(确保你有写`/*` 因为worker上还包含静态文件\)_
8. _\(可选\)_ 如果你不是富哥\(用的大善人的[免费计划](#workers-kv-free-tier)\)，把[wrangler.toml](./wrangler.toml)的`CRON 触发器`调整到合适的频率

### Telegram通知
~~没部署下面的了，先不翻译了~~

To enable telegram notifications, you'll need to take a few additional steps.

1. [Create a new Bot](https://core.telegram.org/bots#creating-a-new-bot)
2. Set the api token you received when creating the bot as content of the `SECRET_TELEGRAM_API_TOKEN` secret in your github repository.
3. Send a message to the bot from the telegram account which should receive the alerts (Something more than `/start`)
4. Get the chat id with `curl https://api.telegram.org/bot<YOUR TELEGRAM API TOKEN>/getUpdates | jq '.result[0] .message .chat .id'`
5. Set the retrieved chat id in the `SECRET_TELEGRAM_CHAT_ID` secret variable
6. Redeploy the status page using the github action

### Deploy on your own

You can clone the repository yourself and use Wrangler CLI to develop/deploy, extra list of things you need to take care of:

- create KV namespace and add the `KV_STATUS_PAGE` binding to [wrangler.toml](./wrangler.toml)
- create Worker secrets _\(optional\)_
  - `SECRET_SLACK_WEBHOOK_URL`
  - `SECRET_DISCORD_WEBHOOK_URL`

## Workers KV 免费计划

Workers 的免费计划包含有限的 KV 使用量，但配额足够支持每2分钟一次的检查。

- 修改`CRON 触发器`为两分钟间隔 (`crons = ["*/2 * * * *"]`) in [wrangler.toml](./wrangler.toml)
- 如果还有其他用到KV的服务，这个间隔可以再提高一些

## 已知的问题

- **如果你用Slack通知，最多监控50个网站**, 因为Cloudflare Worker可以支持的子请求个数有限 \(50\).

  The plan is to support up to 49 by sending only one Slack notification per scheduled run.

- **KV replication lag** - You might get Slack notification instantly, however it may take couple of more seconds to see the change on your status page as [Cron Triggers are usually running on underutilized quiet hours machines](https://blog.cloudflare.com/introducing-cron-triggers-for-cloudflare-workers/#how-are-you-able-to-offer-this-feature-at-no-additional-cost).

- **Initial delay (no data)** - It takes couple of minutes to schedule and run CRON Triggers for the first time

## Future plans

WIP - Support for Durable Objects - Cloudflare's product for low-latency coordination and consistent storage for the Workers platform. There is a working prototype, however, we are waiting for at least open beta.

There is also a managed version of this project, currently in beta. Feel free to check it out https://statusflare.com (https://twitter.com/statusflare_com).

## Running project locally
**Requirements**
- Linux or WSL
- Yarn (`npm i -g yarn`)
- Node 14+

### Steps to get server up and running
**Install wrangler**
```
npm i -g wrangler
```

**Login With Wrangler to Cloudflare**
```
wrangler login
```

**Create your KV namespace in cloudflare**
```
On the workers page navigate to KV, and create a namespace
```

**Update your wrangler.toml with**
```
kv-namespaces = [{binding="KV_STATUS_PAGE", id="<KV_ID>", preview_id="<KV_ID>"}]
```
_Note: you may need to change `kv-namespaces` to `kv_namespaces`_

**Install packages**
```
yarn install
```

**Create CSS**
```
yarn run css
```

**Run**
```
yarn run dev
```
_Note: If the styles do not come through try using `localhost:8787` instead of `localhost:8080`_
