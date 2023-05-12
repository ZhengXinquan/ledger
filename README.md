# ledger

## .github/workflows/sync.yml

```yml
name: Sync

on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Sync to Gitee ledger
        uses: wearerequired/git-mirror-action@master
        env:
          # 注意在 Settings->Secrets 配置 GITEE_RSA_PRIVATE_KEY
          SSH_PRIVATE_KEY: ${{ secrets.GITEE_RSA_PRIVATE_KEY }}
        with:
          # 注意替换为你的 GitHub 源仓库地址
          source-repo: git@github.com:ZhengXinquan/ledger.git
          # 注意替换为你的 Gitee 目标仓库地址
          destination-repo: git@gitee.com:zhengxinquan/ledger.git
```

## api

vercel.com , 最多 12 个文件

## old

旧的 php、html 代码

## init.js

mySql 数据库导入 mongodb，初始化

## test.js

测试

## 远程仓库命令

1.  修改命令 #查看关联的远程仓库

```bash
    git remote -v

    git remote set-url origin [url]

  # 例：git remote set-url origin gitlab@yang/BarUtils.git
```

2.  先删后加

```bash
    git remote rm origin

    git remote add origin [url]

#例：git remote add origin gitlab@yang/BarUtils.git

```

3. 直接修改.git 文件夹下的 config 文件

```bash
[core]
repositoryformatversion = 0
filemode = false
bare = false
logallrefupdates = true
symlinks = false
ignorecase = true
[submodule]
active = .
[remote "origin"]
url = https://github.com/yang/BarUtils.git
fetch = +refs/heads/_:refs/remotes/origin/_
[branch "master"]
remote = origin
merge = refs/heads/maste
```

## 生成 github/gitee/gitlab 等可用的 ssh 密钥

```bash
ssh-keygen -t ed25519 -C "xxxxx@xxxxx.com"
```

按照提示完成三次回车，即可生成 ssh key。通过查看 `~/.ssh/id_ed25519.pub` 文件内容，获取到你的 public key

复制生成后的 ssh key，通过仓库主页 「管理」->「部署公钥管理」->「添加部署公钥」 ，添加生成的 public key 添加到仓库中。

添加后，在终端（Terminal）中输入

```shell
ssh -T git@gitee.com
```

首次使用需要确认并添加主机到本机 SSH 可信列表。若返回 `Hi XXX! You've successfully authenticated, but Gitee.com does not provide shell access.` 内容，则证明添加成功。

## Error: error:0308010C:digital envelope routines::unsupported

[node 版本更换](https://blog.csdn.net/qq_52855464/article/details/128091796)
