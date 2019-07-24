# 使用Nginx配置HTTPS和反向代理

想起大学时自己建了个简单的网站，当时使用的http，然后打开的时候经常都被http劫持，那是真的无可奈何，所以这次必须要整个https。https是啥？想必大家都知道，不懂的直接[超文本安全传输协议](https://zh.wikipedia.org/zh-cn/%E8%B6%85%E6%96%87%E6%9C%AC%E4%BC%A0%E8%BE%93%E5%AE%89%E5%85%A8%E5%8D%8F%E8%AE%AE)

![HTTPS效果图](https://resource.shirmy.me/blog/screenshot/2019-07-24/https-example.png)

## 配置HTTPS

### 证书申请

- 电脑操作系统是macOS 10.14.5
- 服务器：腾讯云CentOS 7.2
- Nginx版本：1.16.0

在这里，我使用的是腾讯云的免费证书：

- 进入控制台 -> 左上角云产品 -> 域名和网站 -> SSL证书 -> 申请免费证书
- 申请之后，大概过不了几分钟，就通过审核了，然后下载之
- 下载之后有几个文件：

![目录](https://resource.shirmy.me/blog/screenshot/2019-07-24/https-folder.png)

### 证书配置

首先登录你的服务器，我们需要创建一个文件夹来放我们的证书

```bash
mkdir /usr/local/nginx/cert
```

然后使用`scp`命令把我们的证书传到服务器上

```bash
# 进入到放证书的文件夹
cd shirmy.me

# 把 Nginx 下的文件远程拷贝到服务器上
scp -r ./Nginx/* 你的服务器用户名@你的服务器IP:/usr/local/nginx/cert
```

接下来就可以修改Nginx的配置了，其实腾讯云提供了很完善的证书安装指引，里面有除了Nginx之外的其它服务器配置方式：

[腾讯云SSL证书安装指引](https://cloud.tencent.com/document/product/400/35223)

如果直接使用文档中的方式，Nginx会报警告，需要做一些小的修改：

```nginx
server {
    listen 443; #SSL 访问端口号为 443
    server_name www.shirmy.com; #填写绑定证书的域名
    # ssl on; #启用 SSL 功能 这行会报警告 去掉即可
    ssl_certificate ../cert/1_www.shirmy.me_bundle.crt; #证书文件名称
    ssl_certificate_key ../cert/2_www.shirmy.me.key; #私钥文件名称
    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2; #请按照这个协议配置
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE; #请按照这个套件配置，配置加密套件，写法遵循 openssl 标准。
    ssl_prefer_server_ciphers on;

    location / {
        root /var/www/www.domain.com; #网站主页路径。此路径仅供参考，具体请您按照实际目录操作。
        index  index.html index.htm;
        # 这是为解决 Vue Router 哈希模式刷新后404的问题 Nginx 找不到文件后会在内部发起一个子请求到根目录下的 index.html
        try_files $uri $uri/ /index.html;
    }
}
```

### HTTP跳转到HTTPS

腾讯云文档提供了以下的配置方式，但是我用的是另外一种配置方式：

```nginx
# 文档提供的配置方式
}
  server {
    listen 80;
    server_name www.domain.com; #填写绑定证书的域名
    rewrite ^(.*)$ https://$host$1 permanent; #把http的域名请求转成https
}
```

#### 另一种方式

这种方式其实是利用了`<meta>`标签中的的`http-equiv`属性，与之对应的值是`content`，我们需要新建一个`index.html`文件，复制并修改以下代码：

```html
<html>
    <!-- 自动刷新并指向新页面，0 是指0秒后刷新(立即刷新) -->
    <meta http-equiv="refresh" content="0;url=https://www.shirmy.me/">
</html>
```

这样当我们访问`http://www.shirmy.me`时就会重新刷新到`https://www.shirmy.me`，然后再修改`nginx`配置如下：

```nginx
server {
    listen 80;  # 监听默认端口
    server_name www.shirmy.me; # 域名
    location / {
        root www/http.shirmy.me/;    # 刚刚的 index.html 所在目录
        index index.html index.htm;
    }
}
```

最后，重启我们的Nginx服务器：

```bash
cd /usr/local/nginx/sbin

# 平滑重启
./nginx -s reload

# 非平滑重启
./nginx -s stop && ./nginx
```

大功告成，配置了HTTPS的网站，要保证网站的链接都是安全的，包括API请求都必须使用HTTPS

## Nginx反向代理

- 我们的网页发起请求时，带个端口岂不是很难看，比如`https//api.shirmy.me:3000/v1/articles`，如何去掉端口呢？
- 又比如说我们要访问集群服务器时，会先访问一个中间服务器，然后这个中间服务器再把你的请求分发到压力小的服务器，这也需要通过反向代理来实现。

```nginx
# 负载均衡就是靠下面这个来实现
# blogapi 替换成你喜欢的名字
upstream blogapi {
    server http://127.0.0.1:3000;
    # server 你也可以选择配置多个IP
}
server {
    # 同上面一样的 HTTPS 配置
    listen 443 ssl;
    server_name api.shirmy.me;
    ssl_certificate ../cert/1_api.shirmy.me_bundle.crt;
    ssl_certificate_key ../cert/2_api.shirmy.me.key;
    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
    ssl_prefer_server_ciphers on;

    # 反向代理配置
    location / {
        # $host 代表转发服务器
        proxy_set_header Host $host;
        proxy_redirect off;
        # 记录真实IP
        proxy_set_header X-Real-IP $remote_addr;
        # 存储请求链路上各代理IP
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # 连接超时时间
        proxy_connect_timeout 60;
        # nginx接收upstream server数据超时时间
        proxy_read_timeout 600;
        # nginx发送数据至upstream server超时时间
        proxy_send_timeout 600;
        # 反向代理到上面定义好的 upstream blogapi 下的服务器上
        proxy_pass http://blogapi;
    }
}
```

如此一来，就实现了反向代理和负载均衡，此外，我们应该让用户第一次访问该服务器后，以后再访问也是访问该服务器，避免多次建立http连接，那么我们可以这样修改：

```nginx
upstream blogapi {
    # 避免每次被请求到多台服务器上 满足用户保持访问同一台服务器 又能实现负载均衡
    ip_hash;
    server http://127.0.0.1:3000;
    # server 你也可以选择配置多个服务器IP
}
```

最后记得重启`/usr/local/nginx/sbin/nginx -s reload`

## 多个域名配置

除了主页shirmy.me之外，我们通常还要有一个管理后台：admin.shirmy.me，因为用的是免费证书，所以我们也只好为子域名申请一个SSL证书，并且以同样的方式配置。

我们又总不能用端口shirmy.me:5000这样子访问吧，其实只要这样做：

```nginx
server {
    listen 80;
    # admin.shirmy.me
    server_name admin.shirmy.me;
    location / {
        # 直接看上面 HTTP 跳转到 HTTPS 的配置
        root www/http.admin.shirmy.me/;
        index index.html index.htm;
    }
}
```

最后记得重启`/usr/local/nginx/sbin/nginx -s reload`