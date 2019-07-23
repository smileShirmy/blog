# 全栈开发—Travis CI持续集成

## 前期准备

- 我使用的 macOS 10.14.5
- 首先我们需要注册一个[GitHub](https://github.com/)账号并且创建项目，把已经写好的代码托管到GitHub上
- 然后登录[Travis CI官网](https://www.travis-ci.org/)，使用GitHub账号登录授权，这时Travis就能获取到Github上的项目
- 准备一个云服务器，我用的是腾讯云（CentOS 7.2 64位）
- 选择需要持续集成的项目，看下图：

![关联项目](https://resource.shirmy.me/blog/screenshot/2019-07-23/01.png)

## 持续集成

这里以一个前端项目为例，首先在项目根目录下创建一个`.travis.yml`文件，并写入以下代码保存：

```yml
language: node_js
cache:
  directories:
  - node_modules      # 缓存 node_modules
node_js: stable       # 稳定版本
branches:
  only:
  - master            # 每次 push 或者 pull request 时会触发持续集成
install:
  - npm install       # 当然你可以使用 yarn
scripts:
  - npm test          # 执行测试
  - npm build         # build
```

这时只要把项目`push`到`master`分支就会触发部署，这一步的目的是验证项目是否通过测试、编译，模拟生产环境进行自动测试，提前发现错误。效果图大概长这样：

![效果图](https://resource.shirmy.me/blog/screenshot/2019-07-23/02.png)

## 持续部署

### 创建 rsa 对

1. 进入你的服务器，查看有没有rsa对，如果没有则使用`ssh-keygen`创建，并赋予权限：

```bash
cd ~/.ssh

sudo chmod 700 ~/.ssh/

sudo chmod 600 ~/.ssh/*
```

2. 将公钥添加到受信任列表，并重新赋予权限

```bash
cat id_rsa.pub >> authorized_keys

cat authorized_keys

sudo chmod 600 ~/.ssh/*
```

3. 如果没有`id_rsa`和`id_rsa.pub`文件，其实就跟你配置`GitHub SSH Key`一样：

```bash
ssh-keygen -t rsa -C "这了替换成你的邮箱"

# 获取秘钥并复制之
cat id_rsa.pub
```

浏览器打开GitHub：用户头像 -> Setting -> SSH and GPG keys -> New SSH Key，添加之

## 安装 Ruby

[Ruby官方安装指南](http://www.ruby-lang.org/en/downloads/)

上面的可以找到Windows、Mac、Linux的Ruby安装方式，我使用的是Mac，直接使用[Homebrew](https://brew.sh/)安装，当然Macb本身就自带Ruby：

[安装教程](https://github.com/ruby-china/homeland/wiki/Mac-OS-X-%E4%B8%8A%E5%AE%89%E8%A3%85-Ruby)

```bash
# 安装 homebrew
ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"

# 安装最新版本 Ruby

# 更新 brew 支持的版本信息
brew update

# 编译安装最新版本
brew install ruby

# 检验是否安装成功
ruby --version
```

## 安装配置 Travis 客户端

```bash
# 安装
gem install travis
```

进入到要部署的项目根目录下，用GitHub的账号密码登录Travis客户端：

```bash
travis login --auto
```

利用服务器私钥加密生成`id_rsa.enc`文件，travis会借助它来登录你的服务器，这样就可以在你的服务器上进行自动部署的操作了：

```bash
travis encrypt-file ~/.ssh/id_rsa --add
```

执行完这句后，项目根目录下就会生成一个`id_rsa.enc`文件，并且先前在目录下创建好的`.travis.yml`文件会多出这样一行：

```yml
before_install:
- openssl aes-256-cbc -K $encrypted_######_key -iv $encrypted_#######_iv -in id_rsa.enc -out ~\/.ssh/id_rsa -d
```

踩了很多坑？没关系，这时已经非常接近成功了

## 执行部署

Travis CI自带了一些生命钩子，我们可以在相应的生命钩子([Travis CI Job Lifecycle](https://docs.travis-ci.com/user/job-lifecycle/))搞事情，其中`after_success`钩子是执行部署脚本的钩子。

此时在`.travis.yml`上添加部署脚本，如果你不想暴露你在服务器上的部署用户名和服务器IP，你可以在travis中配置环境变量

项目部署面板 -> 右侧的More options -> Settings -> 找到Environment Variables -> 输入变量名，变量值，然后在yml文件中用`$变量名`来引用

```yml
language: node_js
cache:
  directories:
  - node_modules
node_js: stable
branches:
  only:
  - master
before_install:
  # 注意 这里我改成了 ~/.ssh/id_rsa 而不是自动生成的 ~\/.ssh/id_rsa
  - openssl aes-256-cbc -K $encrypted_######_key -iv $encrypted_######_iv -in id_rsa.enc -out ~/.ssh/id_rsa -d
  # 赋予权限
  - chmod 600 ~/.ssh/id_rsa
install:
  - npm install
scripts:
  - npm test          # 执行测试
  - npm build         # build
# 执行部署脚本
after_success:
# $DEPLOY_USER 环境变量：服务器用户名
# $DEPLOY_HOST 环境变量：服务器IP
# 项目目录 你在服务器上的项目目录
- ssh "$DEPLOY_USER"@"$DEPLOY_HOST" -o StrictHostKeyChecking=no 'cd 项目目录 && git pull && bash ./script/deploy.sh'
addons:
  ssh_known_hosts:
  # 你的服务器IP
  - "$DEPLOY_HOST"
```

在根目录下创建script文件夹放部署脚本

```bash
# script/deploy.sh
#!/bin/bash

echo 'npm install'
npm install

echo 'npm run build'
npm run build

echo 'success'
```

部署成功之后，就会看到上面有个下面这样的徽章，点击它，按照你需要的格式复制使用

[![Build Status](https://www.travis-ci.org/smileShirmy/smile-blog-nuxt.svg?branch=master)](https://www.travis-ci.org/smileShirmy/smile-blog-nuxt)

## 总结

再来回顾一下流程：

1. Travis官网关联GitHub项目
2. 在服务器中生成rsa对，把rsa对添加到github上，并把项目拉到服务器中
3. 安装ruby，使用ruby及travis客户端并登陆，在项目目录下生成id_rsa.enc
4. 编写项目部署脚本
5. 把项目推送或PR到相应的分支上
6. 获取徽章