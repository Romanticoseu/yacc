/**
 * LALR相关
 * // FIXME：有BUG
 * by Twielon
 * 2020-05 @ https://github.com/czh/seu-lex-yacc
 */

import { LR1Analyzer } from './LR1'
import { LR1DFA, LR1Item, LR1State } from './Grammar'

export function LR1DFAtoLALRDFA(lr1: LR1Analyzer) {
  type CoreArrCell = { core: LR1Item[]; states: number[] } // 核+该核所在所有状态号的索引
  // {核的内容，包含这个核的状态号的数组}
  // 计算同心集
  let coreArr: CoreArrCell[] = []
  const dfaStates = lr1.dfa.states
  // 判断core相同，不看lookahead
  function sameCore(core1: LR1Item[], core2: LR1Item[]) {
    return (
      core1.every(i1 =>
        core2.some(i2 => i1.producer == i2.producer && i1.dotPosition == i2.dotPosition)
      ) &&
      core2.every(i1 =>
        core1.some(i2 => i1.producer == i2.producer && i1.dotPosition == i2.dotPosition)
      )
    )
  }
  for (let i = 0; i < dfaStates.length; i++) {
    let core: LR1Item[] = [...dfaStates[i].items]
    let checker = coreArr.findIndex(x => sameCore(x.core, core))
    if (checker != -1) {
      // 存在同核心状态，直接加入
      coreArr[checker].states.push(i)
      // 注意合并lookahead
      for (let item of core) {
        if (!coreArr[checker].core.some(it => LR1Item.same(it, item)))
          coreArr[checker].core.push(item)
      }
    } else {
      coreArr.push({ core, states: [i] })
    }
  }
  // LALR构建
  let LALRDFA = new LR1DFA(-1) // 开始状态号后面分配
  let old2new = new Map<number, number>() // 旧状态 - 新状态下标对应，用于重构边
  for (let i = 0; i < coreArr.length; i++) {
    let newState = new LR1State(coreArr[i].core)
    for (let j of coreArr[i].states) old2new.set(j, i)
    LALRDFA.addState(newState)
  }
  for (let i = 0; i < LALRDFA.states.length; i++) {
    let representativeOldState = coreArr[i].states[0] // 选取第一个对应状态作为代表
    let oldEdges = lr1.dfa.adjList[representativeOldState] // 采纳它的边
    for (let edge of oldEdges)
      LALRDFA.link(
        old2new.get(representativeOldState) as number,
        old2new.get(edge.to) as number,
        edge.alpha
      )
  }
  // 修正起始状态号
  LALRDFA.startStateId = old2new.get(lr1.dfa.startStateId) as number
  return LALRDFA
}
