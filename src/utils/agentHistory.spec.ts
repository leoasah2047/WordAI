import { beforeAll, describe, expect, it, vi } from 'vitest'

import { AgentHistoryManager } from './agentHistory'

describe('AgentHistoryManager', () => {
  let manager: AgentHistoryManager

  beforeAll(() => {
    // Mock Office Word global
    globalThis.Word = {
      run: vi.fn().mockImplementation(async callback => {
        const context = {
          application: {
            undo: vi.fn(),
            redo: vi.fn(),
          },
          sync: vi.fn(),
        }
        return callback(context)
      }),
    } as any
  })

  it('should record actions and update state', () => {
    manager = new AgentHistoryManager()
    const action1 = { id: '1', type: 'test', description: 'desc 1', timestamp: Date.now() }
    const action2 = { id: '2', type: 'test', description: 'desc 2', timestamp: Date.now() }

    manager.recordAction(action1)
    expect(manager.canUndo()).toBe(true)
    expect(manager.canRedo()).toBe(false)
    expect(manager.getCurrentAction()).toEqual(action1)

    manager.recordAction(action2)
    expect(manager.getCurrentAction()).toEqual(action2)
  })

  it('should handle undo and redo properly', async () => {
    manager = new AgentHistoryManager()
    const action1 = { id: '1', type: 'test', description: 'desc 1', timestamp: Date.now() }
    manager.recordAction(action1)

    const undoResult = await manager.undo()
    expect(undoResult).toBe(true)
    expect(manager.canUndo()).toBe(false)
    expect(manager.canRedo()).toBe(true)
    expect(manager.getNextAction()).toEqual(action1)

    const redoResult = await manager.redo()
    expect(redoResult).toBe(true)
    expect(manager.canUndo()).toBe(true)
    expect(manager.canRedo()).toBe(false)
    expect(manager.getCurrentAction()).toEqual(action1)
  })

  it('should clear history when recordAction is called after undo', async () => {
    manager = new AgentHistoryManager()
    manager.recordAction({ id: '1', type: 'test', description: '1', timestamp: 0 })
    manager.recordAction({ id: '2', type: 'test', description: '2', timestamp: 0 })

    await manager.undo()
    expect(manager.canRedo()).toBe(true)

    manager.recordAction({ id: '3', type: 'test', description: '3', timestamp: 0 })
    expect(manager.canRedo()).toBe(false)
    expect(manager.getHistory().length).toBe(2) // 1 and 3
    expect(manager.getCurrentAction()?.id).toBe('3')
  })

  it('should enforce MAX_HISTORY_SIZE', () => {
    manager = new AgentHistoryManager()
    for (let i = 0; i < 15; i++) {
      manager.recordAction({ id: String(i), type: 'test', description: String(i), timestamp: 0 })
    }
    expect(manager.getHistory().length).toBe(10)
    expect(manager.getHistory()[0].id).toBe('5')
  })
})
