# koishi-plugin-bull-card-game

[![npm](https://img.shields.io/npm/v/koishi-plugin-bull-card-game?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-bull-card-game)

## 🎈 介绍

这是一个基于 Koishi 框架的斗牛纸牌游戏插件，让你和你的群友可以在群里一起玩斗牛，体验牛气冲天的乐趣！ 🐂

## 📦 安装

```
前往 Koishi 插件市场添加该插件即可
```

## 🎮 使用

- 仅群聊触发
- 建议为各指令添加合适的指令别名
- 在群里发送指令，开始斗牛大冒险！ 🃏

## ⚙️ 游戏规则

- 斗牛是一种流行的纸牌游戏，每个玩家需要拿到五张牌，然后根据牌面计算出结果，结果越大越好。
- 游戏开始时，每个玩家先发三张牌，然后轮流要牌，直到手上有五张牌为止。
- 游戏结束时，根据每个玩家的结果进行比较，结果最大的玩家获胜，如果有多个玩家结果相同，则比较最大的一张牌的大小。
- 游戏的积分系统是：每局游戏的胜者获得 (玩家人数 - 胜者人数) / 胜者人数 分，每局游戏的败者扣除 1 分。

## 🃏 牌面计算

- 牌面计算的方法是：从五张牌中任意选出三张牌，使其点数之和为 10 的倍数，剩余两张牌的点数之和即为结果。
- 牌面计算时，JQK 都按 10 算，A 按 1 算。
- 如果剩余两张牌的点数之和也是 10 的倍数，则结果为 10（称为“牛牛”），否则按照余数计算（称为“牛几”），例如余数为 9，则结果为 9（称为“牛九”）。
- 如果五张牌中没有任何三张牌可以组成 10 的倍数，则结果为 0（称为“没牛”）。
- 特殊情况：
  - 如果五张牌中有四张相同的点数，则结果为 11（称为“四炸”）。
  - 如果五张牌都是 JQK，则结果为 12（称为“五花牛”）。
  - 如果五张牌都小于等于 5，并且点数之和小于等于 10，则结果为 13（称为“五小牛”）。

## 📝 指令说明

| 指令 | 功能 | 备注 |
| --- | --- | --- |
| bullCard | 查看斗牛纸牌游戏帮助 | |
| bullCard.join | 加入斗牛纸牌游戏 | 只能在游戏未开始时加入 |
| bullCard.quit | 退出斗牛纸牌游戏 | 只能在游戏未开始时退出 |
| bullCard.start | 开始斗牛纸牌游戏 | 需要至少两个玩家才能开始 |
| bullCard.restart | 重新开始斗牛纸牌游戏 | 只能在游戏进行中重新开始 |
| bullCard.hit | 要一张牌 | 只能在自己的回合要牌 |
| bullCard.rank | 查看斗牛积分排行榜 | |

## 🌠 后续计划

- 增加更多的游戏选项和自定义功能
- 优化游戏的交互体验和文本设计
- 支持更多的纸牌游戏模式

## 🙏 致谢

* [Koishi](https://koishi.chat/) - 机器人框架
* [欢乐斗牛_百度百科 (baidu.com)](https://baike.baidu.com/item/%E6%AC%A2%E4%B9%90%E6%96%97%E7%89%9B/7961223)

## 📄 License

MIT License © 2023