import { Context, Keys, Logger, Random, Schema, Session, h } from 'koishi'

export const name = 'bull-card-game'
export const logger = new Logger('bullCard')
export const usage = `## 🎮 使用

- 仅群聊触发
- 建议为各指令添加合适的指令别名
- 在群里发送指令，开始斗牛大冒险！ 🃏

## ⚙️ 游戏规则

- 斗牛是一种流行的纸牌游戏，每个玩家需要拿到五张牌，然后根据牌面计算出结果，结果越大越好。
- 游戏开始时，每个玩家先发三张牌，然后轮流要牌，直到手上有五张牌为止。
- 游戏结束时，根据每个玩家的结果进行比较，结果最大的玩家获胜，如果有多个玩家结果相同，则比较最大的一张牌的大小。
- 游戏的积分系统是：每局游戏的胜者获得 (玩家人数 - 胜者人数) / 胜者人数 分，每局游戏的败者扣除 1 分。

## 🃏 牌面计算

- 牌面计算的方法是：从五张牌中任意选出三张牌，使其点数之和为 10 的倍数，剩余两张牌的点数之和除以 10 取余数即为结果。
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
| bullCard | 查看斗牛纸牌游戏指令帮助 | |
| bullCard | 查看斗牛纸牌游戏规则 | |
| bullCard.join | 加入斗牛纸牌游戏 | 只能在游戏未开始时加入 |
| bullCard.quit | 退出斗牛纸牌游戏 | 只能在游戏未开始时退出 |
| bullCard.start | 开始斗牛纸牌游戏 | 需要至少两个玩家才能开始 |
| bullCard.restart | 重新开始斗牛纸牌游戏 | 只能在游戏进行中重新开始 |
| bullCard.hit | 要一张牌 | 只能在自己的回合要牌 |
| bullCard.rank | 查看斗牛积分排行榜 | |

## 🌠 后续计划

- 增加更多的游戏选项和自定义功能
- 优化游戏的交互体验和文本设计
- 支持更多的纸牌游戏模式`

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

declare module 'koishi' {
  interface Tables {
    bull_card_games: BullCardGames
    bull_card_players: BullCardPlayers
    bull_card_rank: BullCardRank
  }
}
export interface BullCardGames {
  id: number
  guildId: string
  isStarted: boolean
  members: string[]
  memberId: string
  deck: Card[]
  score: number
}
export interface BullCardPlayers {
  id: number
  guildId: string
  userId: string
  hand: Card[]
  score: number
  maxCard: Card
}
export interface BullCardRank {
  id: number
  guildId: string
  userId: string
  userName: string
  score: number
}

enum Suit {
  Spade = '♠', // 黑桃
  Heart = '♥', // 红心
  Club = '♣', // 梅花
  Diamond = '♦' // 方块
}

enum Rank {
  Ace = 'A', // A
  Two = '2', // 2
  Three = '3', // 3
  Four = '4', // 4
  Five = '5', // 5
  Six = '6', // 6
  Seven = '7', // 7
  Eight = '8', // 8
  Nine = '9', // 9
  Ten = '10', // 10
  Jack = 'J', // J
  Queen = 'Q', // Q
  King = 'K' // K
}

class Card {
  suit: Suit // 花色
  rank: Rank // 点数，1-13分别表示A-K
  constructor(suit: Suit, rank: Rank) {
    this.suit = suit
    this.rank = rank
  }
}
const msg = {
  gameStarted: "牛牛大战，一触即发！🐂",
  gameNotStarted: "别着急，还没到斗牛的时候！🐌",
  joinGameSuccess: "欢迎加入斗牛大冒险！👏",
  joinGameFailed: "哎呀，你已经在游戏里了，不能重复加入哦！😅",
  quitGameSuccess: "很遗憾你要离开我们，祝你下次好运！👋",
  quitGameFailed: "你不在游戏里，怎么能退出呢？😂",
  gameRestarted: "有人按了重置按钮，游戏重新开始啦！🔄",
  gameStartSuccess: "游戏开始啦！\n我会给你们每个人发三张牌，看谁能拿到最大的牛！🃏",
  gameStartFailed: "游戏还不能开始，玩家人数不够呢！至少要两个人才能斗牛哦！👥",
  currentPlayerNotTurn: "现在不是你的回合，耐心等一等吧！😊",
  drawCardSuccess: "你成功地要了一张牌！👍",
  nextPlayerHand: "下一个玩家会拿到什么样的牌呢？让我们拭目以待吧！😯",
  completeHand: "你已经拿到了五张牌，看看你有没有牛吧！👀",
  lastPlayerEnding: "你是最后一个玩家了！游戏马上就要结算了！😱"
}


export function apply(ctx: Context) {
  // 仅群聊触发
  ctx = ctx.guild()

  ctx.model.extend('bull_card_games', {
    id: 'unsigned',
    guildId: 'string',
    isStarted: 'boolean',
    members: 'list',
    memberId: 'string',
    deck: 'json',
    score: 'integer',
  }, {
    autoInc: true,
  })
  ctx.model.extend('bull_card_players', {
    id: 'unsigned',
    guildId: 'string',
    userId: 'string',
    hand: 'json',
    score: 'integer',
    maxCard: 'json'
  }, {
    autoInc: true,
  })
  ctx.model.extend('bull_card_rank', {
    id: 'unsigned',
    guildId: 'string',
    userId: 'string',
    userName: 'string',
    score: 'double',
  }, {
    autoInc: true,
  })

  ctx.command('bullCard', '查看斗牛纸牌游戏指令帮助')
    .action(async ({ session }) => {
      await session.execute(`bullCard -h`)
    })
  ctx.command('bullCard.rule', '查看斗牛纸牌游戏规则')
    .action(async ({ session }) => {
      return `⚙️ 游戏规则

- 斗牛是一种流行的纸牌游戏，每个玩家需要拿到五张牌，然后根据牌面计算出结果，结果越大越好。
- 游戏开始时，每个玩家先发三张牌，然后轮流要牌，直到手上有五张牌为止。
- 游戏结束时，根据每个玩家的结果进行比较，结果最大的玩家获胜，如果有多个玩家结果相同，则比较最大的一张牌的大小。
- 游戏的积分系统是：每局游戏的胜者获得 (玩家人数 - 胜者人数) / 胜者人数 分，每局游戏的败者扣除 1 分。

🃏 牌面计算

- 牌面计算的方法是：从五张牌中任意选出三张牌，使其点数之和为 10 的倍数，剩余两张牌的点数之和除以 10 取余数即为结果。
- 牌面计算时，JQK 都按 10 算，A 按 1 算。
- 如果剩余两张牌的点数之和也是 10 的倍数，则结果为 10（称为“牛牛”），否则按照余数计算（称为“牛几”），例如余数为 9，则结果为 9（称为“牛九”）。
- 如果五张牌中没有任何三张牌可以组成 10 的倍数，则结果为 0（称为“没牛”）。
- 特殊情况：
  - 如果五张牌中有四张相同的点数，则结果为 11（称为“四炸”）。
  - 如果五张牌都是 JQK，则结果为 12（称为“五花牛”）。
  - 如果五张牌都小于等于 5，并且点数之和小于等于 10，则结果为 13（称为“五小牛”）。`
    })
  ctx.command('bullCard.join', '加入斗牛纸牌游戏')
    .action(async ({ session }) => {
      const { guildId, userId, username } = session
      const gameInfo = await getGameInfo(ctx, guildId)
      if (gameInfo.isStarted) {
        return msg.gameStarted
      }
      if (gameInfo.members.includes(userId)) {
        return `${msg.joinGameFailed}`
      }
      await getRankInfo(ctx, guildId, userId, username)
      await getPlayerInfo(ctx, guildId, userId)
      await ctx.database.set('bull_card_games', { guildId }, { members: [...gameInfo.members, userId] })

      return `${msg.joinGameSuccess}当前玩家人数：【${gameInfo.members.length + 1}】人！

欢迎加入斗牛大家庭，你的加入如一抹明亮的彩虹，让游戏更加绚丽多彩！🌈🎉

快来与大家一起挑战斗牛的极限，展现你的牛气十足的技巧吧！🐂💪`
    })
  ctx.command('bullCard.quit', '退出斗牛纸牌游戏')
    .action(async ({ session }) => {
      const { guildId, userId } = session
      const gameInfo = await getGameInfo(ctx, guildId)
      if (gameInfo.isStarted) {
        return msg.gameStarted
      }
      if (!gameInfo.members.includes(userId)) {
        return `${msg.quitGameFailed}`
      }
      await ctx.database.set('bull_card_games', { guildId }, { members: gameInfo.members.filter(member => member !== userId) })
      return `${msg.quitGameSuccess}当前玩家人数：【${gameInfo.members.length - 1}】人！

你离开了斗牛大家庭，好似一颗流星划过夜空。愿你在下次的冒险中收获满满的好运！🌠✨`
    })
  ctx.command('bullCard.start', '开始斗牛纸牌游戏')
    .action(async ({ session }) => {
      const { guildId } = session
      const gameInfo = await getGameInfo(ctx, guildId)
      if (gameInfo.isStarted) {
        return msg.gameStarted
      }
      if (gameInfo.members.length < 2) {
        return msg.gameStartSuccess
      }

      let deck = createAndShuffleDeck(3) // 调用函数创建并洗牌一副扑克牌

      await ctx.database.set('bull_card_games', { guildId }, { deck })

      let members = gameInfo.members

      // 遍历 members 数组中的每一位成员，每个人分别发 3 张牌（发牌时若牌堆已经空了则新建一个牌堆）
      for (const userId of members) {
        if (deck.length < 3) { // 如果牌堆剩余的牌不足三张，则重新创建并洗牌一副扑克牌
          deck = createAndShuffleDeck(3)
          await ctx.database.set('bull_card_games', { guildId }, { deck })
        }
        let hand = deck.slice(-3) // 从牌堆中取出最后三张牌作为手牌
        deck.length -= 3 // 更新牌堆的长度

        await ctx.database.set('bull_card_players', { guildId, userId }, { hand })
      }

      const shuffledMembers = Random.shuffle(members);
      const memberId = shuffledMembers[0];
      await ctx.database.set('bull_card_games', { guildId }, { members: shuffledMembers, memberId, isStarted: true, deck });
      const playerInfos = await ctx.database.get('bull_card_players', { guildId });
      const filteredPlayerInfos = playerInfos.filter(playerInfo => shuffledMembers.includes(playerInfo.userId));
      return `${msg.gameStartSuccess}

${filteredPlayerInfos.map(playerInfo => `玩家【${h.at(playerInfo.userId)}】的手牌如下：\n${visualizeDeck(playerInfo.hand)}`).join('\n\n')}

第一位玩家是：【${h.at(memberId)}】

快来发动你的斗牛技能，发送【要牌指令】，让我给你发下一张牌吧！💪🃏`;
    })

  ctx.command('bullCard.restart', '重新开始斗牛纸牌游戏')
    .action(async ({ session }) => {
      const { guildId } = session
      const gameInfo = await getGameInfo(ctx, guildId)
      if (!gameInfo.isStarted) {
        return msg.gameNotStarted
      }
      await ctx.database.set('bull_card_games', { guildId }, { isStarted: false, members: [] })
      return msg.gameRestarted
    })
  ctx.command('bullCard.hit', '要一张牌')
    .action(async ({ session }) => {
      const { guildId, userId } = session
      const gameInfo = await getGameInfo(ctx, guildId)

      // 如果游戏未开始或者不是当前玩家的回合，直接返回
      if (!gameInfo.isStarted || userId !== gameInfo.memberId) {
        return !gameInfo.isStarted ? undefined : msg.currentPlayerNotTurn
      }

      // 如果牌堆为空，重新洗牌
      let deck = gameInfo.deck
      if (deck.length < 1) {
        deck = createAndShuffleDeck(3)
        await ctx.database.set('bull_card_games', { guildId }, { deck })
      }

      // 从牌堆顶部抽一张牌，并更新玩家的手牌
      const card = deck.pop()
      const playerInfo = await getPlayerInfo(ctx, guildId, userId)
      playerInfo.hand.push(card)
      await ctx.database.set('bull_card_players', { guildId, userId }, { hand: playerInfo.hand })

      // 切换到下一个玩家
      const nextMemberId = getNextMemberId(gameInfo.members, gameInfo.memberId)
      await ctx.database.set('bull_card_games', { guildId }, { memberId: nextMemberId, deck })

      if (playerInfo.hand.length === 5) {
        // 得到结果
        const result = await calculateResult(ctx, guildId, userId, playerInfo.hand)
        const maxCard = getMaxCard(playerInfo.hand)
        await ctx.database.set('bull_card_players', { guildId, userId }, { maxCard })
        if (gameInfo.members[gameInfo.members.length - 1] === gameInfo.memberId) {
          await session.send(`${msg.drawCardSuccess}
当前玩家是：【${h.at(gameInfo.memberId)}】
你拿到了最后一张牌，你的手牌已经满了！🙌
你的手牌如下：
【${visualizeDeck(playerInfo.hand)}】
你的结果为：【${result}】

你是最后一个玩家了，游戏就要结束了！😮
让我们看看谁能斗出最大的牛，赢得胜利吧！🏆`)
          await endGame(ctx, session, guildId, gameInfo.members)
          return
        }
        return `${msg.drawCardSuccess}
当前玩家是：【${h.at(gameInfo.memberId)}】
你成功地拿到了一张新的牌，让我们看看你的手牌吧！👀
${msg.completeHand}
你的手牌如下：
【${visualizeDeck(playerInfo.hand)}】
你的结果为：【${result}】

下一个玩家是：【${h.at(nextMemberId)}】
请发送【要牌指令】来获取你的下一张牌！🃏
期待你能斗出大牛哦！🐂`
      }

      return `${msg.drawCardSuccess}
当前玩家是：【${h.at(gameInfo.memberId)}】
你成功地要了一张牌，让我们看看你的手牌吧！👀
你的手牌如下：
【${visualizeDeck(playerInfo.hand)}】

下一个玩家是：【${h.at(nextMemberId)}】
请发送【要牌指令】来获取你的下一张牌！🃏
期待你能斗出大牛哦！🐂`
    })

  ctx.command('bullCard.rank', '查看斗牛积分排行榜')
    .action(async ({ session }) => {
      const { guildId } = session
      const rankInfo = await ctx.database.get('bull_card_rank', { guildId })

      // 根据score属性进行降序排序，并只保留前十名玩家
      const topTen = rankInfo.sort((a, b) => b.score - a.score).slice(0, 10)
      // 生成排行榜的纯文本，并返回
      return generateRankTable(topTen)
    })

  // 定义一个函数来生成排行榜的纯文本
  function generateRankTable(rankInfo: BullCardRank[]): string {
    // 定义排行榜的模板字符串
    const template = `
牛气冲天榜：
 排名  昵称   积分  
--------------------
${rankInfo.map((player, index) => ` ${String(index + 1).padStart(2, ' ')}   ${player.userName.padEnd(6, ' ')} ${player.score.toString().padEnd(4, ' ')}`).join('\n')}
`
    return template
  }

}


async function getGameInfo(ctx: Context, guildId: string) {
  const gameInfo = await ctx.database.get('bull_card_games', { guildId })
  if (gameInfo.length === 0) {
    return await ctx.database.create('bull_card_games', { guildId })
  }
  return gameInfo?.[0]
}

async function getRankInfo(ctx: Context, guildId: string, userId: string, userName: string) {
  const rankInfo = await ctx.database.get('bull_card_rank', { guildId, userId })
  if (rankInfo.length === 0) {
    return await ctx.database.create('bull_card_rank', { guildId, userId, userName })
  } else if (userName !== rankInfo[0].userName) {
    await ctx.database.set('bull_card_rank', { guildId, userId }, { userName })
    rankInfo[0].userName = userName
  }
  return rankInfo?.[0]
}

async function getPlayerInfo(ctx: Context, guildId: string, userId: string) {
  const playerInfo = await ctx.database.get('bull_card_players', { guildId, userId })
  if (playerInfo.length === 0) {
    return await ctx.database.create('bull_card_players', { guildId, userId })
  }
  return playerInfo?.[0]
}

// 创建并洗牌一副扑克牌的函数
function createAndShuffleDeck(numShuffles: number): Card[] {
  let deck: Card[] = []
  // 初始化
  for (let suit of Object.values(Suit)) { // 遍历Suit枚举的所有值
    for (let rank of Object.values(Rank)) { // 遍历Rank枚举的所有值
      deck.push(new Card(suit, rank)) // 使用Rank枚举的成员名作为参数
    }
  }
  // Fisher-Yates 洗牌算法
  function shuffle(array: any[]) {
    let i = array.length
    while (i > 0) {
      let j = Math.floor(Math.random() * i)
      i--
        ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  for (let i = 0; i < numShuffles; i++) {
    shuffle(deck) // 进行多次洗牌操作
  }

  return deck
}

// 将牌堆可视化成无间隔的字符串
function visualizeDeck(deck: Card[]): string {
  let result = ''
  for (const card of deck) {
    result += `${card.suit}${card.rank}`
  }
  return result
}

function getNextMemberId(members: string[], memberId: string): string {
  const index = members.indexOf(memberId);
  const nextIndex = (index + 1) % members.length;
  return members[nextIndex];
}

// 定义一个函数，根据游戏规则计算 hand 的游戏结果
async function calculateResult(ctx: Context, guildId: string, userId: string, hand: Card[]): Promise<string> {
  // 定义一个数组，存放牌的数字
  let numbers: number[] = [];
  // 定义一个变量，存放最大的余数
  let maxRemainder = 0;
  // 定义一个变量，存放结果的索引
  let resultIndex: number = 0;
  let isNiu: boolean = false
  // 定义一个数组，存放结果的字符串
  const results = [
    "没牛",
    "牛丁",
    "牛二",
    "牛三",
    "牛四",
    "牛五",
    "牛六",
    "牛七",
    "牛八",
    "牛九",
    "牛牛",
    "四炸",
    "五花牛",
    "五小牛"
  ];

  // 遍历 hand 中的每张牌
  for (let card of hand) {
    // 获取牌的 rank
    let rank = card.rank;
    // 如果 rank 是 JQK，则用 10 代替
    if (rank === "J" || rank === "Q" || rank === "K") {
      numbers.push(10);
    } else if (rank === "A") {
      numbers.push(1);
    } else {
      // 否则，将 rank 转换为数字并存入数组
      numbers.push(parseInt(rank));
    }
  }

  // 计算数组中所有数字的和
  let sum = numbers.reduce((acc, cur) => acc + cur, 0);

  // 判断是否是五小牛
  if (checkNumbers(numbers)) {
    resultIndex = 13;
  }
  // 判断是否是五花牛
  else if (isSpecialHand(hand)) {
    resultIndex = 12;
  }
  // 判断是否是四炸
  else if (hasFourOfAKind(hand)) {
    resultIndex = 11;
  } else {
    // 使用三重循环遍历所有可能的三张牌的组合
    for (let i = 0; i < numbers.length - 2; i++) {
      for (let j = i + 1; j < numbers.length - 1; j++) {
        for (let k = j + 1; k < numbers.length; k++) {
          // 计算三张牌的和
          let threeSum = numbers[i] + numbers[j] + numbers[k];
          // 如果和是 10 的倍数，则计算剩余两张牌的余数，并更新最大余数和结果索引
          if (threeSum % 10 === 0) {
            let remainder = (sum - threeSum) % 10;
            if (remainder % 10 === 0) {
              isNiu = true
            }
            if (remainder > maxRemainder) {
              maxRemainder = remainder;
            }
          }
        }
      }
    }
    // 如果有牛，则结果索引等于 10，否则等于最大余数
    resultIndex = isNiu ? 10 : maxRemainder;
  }

  await ctx.database.set('bull_card_players', { guildId, userId }, { score: resultIndex })

  // 返回结果字符串
  return results[resultIndex];
}

function hasFourOfAKind(hand: Card[]): boolean {
  const ranks: { [key: string]: number } = {};

  for (const card of hand) {
    const rank = card.rank;
    ranks[rank] = (ranks[rank] || 0) + 1;
    if (ranks[rank] === 4) {
      return true;
    }
  }

  return false;
}

function isSpecialHand(hand: Card[]): boolean {
  for (const card of hand) {
    if (card.rank !== 'J' && card.rank !== 'Q' && card.rank !== 'K') {
      return false;
    }
  }

  return true;
}

function checkNumbers(numbers: number[]): boolean {
  const sum = numbers.reduce((acc, cur) => acc + cur, 0);
  const allLessThan5 = numbers.every((num) => num <= 5);

  return allLessThan5 && sum <= 10;
}

function getMaxCard(hand: Card[]) {
  const values = {
    "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13,
    "♦": 1, "♣": 2, "♥": 3, "♠": 4
  };

  let maxCard = hand[0];

  for (let i = 1; i < hand.length; i++) {
    let card = hand[i];

    const compareRank = values[card.rank] - values[maxCard.rank];
    const compareSuit = values[card.suit] - values[maxCard.suit];

    if (compareRank > 0 || (compareRank === 0 && compareSuit > 0)) {
      maxCard = card;
    }
  }

  return maxCard;
}

async function endGame(ctx: Context, session: Session<never, never>, guildId: string, members: string[]) {
  const playerInfos = await ctx.database.get('bull_card_players', { guildId });
  const filteredPlayerInfos = playerInfos.filter(playerInfo => members.includes(playerInfo.userId));
  const winners = getWinners(filteredPlayerInfos);
  const loserPlayerInfos = filteredPlayerInfos.filter(playerInfo => !winners.some(winner => winner.userId === playerInfo.userId));

  const loserNames: string[] = [];
  const winningPoints = (members.length - winners.length) / winners.length;

  for (const winner of winners) {
    const rankInfo = (await ctx.database.get('bull_card_rank', { guildId, userId: winner.userId }))[0];
    if (rankInfo) {
      await ctx.database.set('bull_card_rank', { guildId, userId: winner.userId }, { score: rankInfo.score + winningPoints });
    }
  }

  for (const loser of loserPlayerInfos) {
    const rankInfo = (await ctx.database.get('bull_card_rank', { guildId, userId: loser.userId }))[0];
    if (rankInfo) {
      await ctx.database.set('bull_card_rank', { guildId, userId: loser.userId }, { score: rankInfo.score - 1 });
      loserNames.push(loser.userId);
    }
  }

  const winnerNames = winners.map(winner => `【${h.at(winner.userId)}】`).join('\n');
  const loserNamesFormatted = loserNames.map(loser => `【${h.at(loser)}】`).join('\n');

  await session.sendQueued(`牛气冲天，斗牛结束！\n本局游戏的结果如下：\n${winnerNames}恭喜你们斗出了大牛，赢得了胜利！🎉\n获得积分【${winningPoints}】 点！👏\n\n${loserNamesFormatted}很遗憾，你们的牛不够大，输掉了比赛！😢\n扣除积分【1】点！😭`);

  await ctx.database.set('bull_card_games', { guildId }, { isStarted: false, members: [] });
}

function getWinners(playerInfos: BullCardPlayers[]): BullCardPlayers[] {
  let winners = [];
  let maxScore = 0;
  const suitWeight = {
    "♠": 4,
    "♥": 3,
    "♣": 2,
    "♦": 1,
  };
  const rankWeight = {
    "K": 13,
    "Q": 12,
    "J": 11,
    "10": 10,
    "9": 9,
    "8": 8,
    "7": 7,
    "6": 6,
    "5": 5,
    "4": 4,
    "3": 3,
    "2": 2,
    "A": 1,
  };

  for (const player of playerInfos) {
    const { score, maxCard } = player;
    const { suit: playerSuit, rank: playerRank } = maxCard;

    if (score > maxScore) {
      maxScore = score;
      winners = [player];
    } else if (score === maxScore) {
      const { suit: winnerSuit, rank: winnerRank } = winners[0]?.maxCard || {};

      if (rankWeight[playerRank] > rankWeight[winnerRank]) {
        winners = [player];
      } else if (rankWeight[playerRank] === rankWeight[winnerRank]) {
        if (suitWeight[playerSuit] > suitWeight[winnerSuit]) {
          winners = [player];
        } else if (suitWeight[playerSuit] === suitWeight[winnerSuit]) {
          winners.push(player);
        }
      }
    }
  }

  return winners;
}