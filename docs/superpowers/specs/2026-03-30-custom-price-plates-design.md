# 自定义价格碟功能设计文档

**日期：** 2026-03-30
**项目：** 寿司碟计价器
**功能：** 新增自定义价格碟功能

## 1. 功能概述

### 1.1 目标
在现有寿司碟计价器基础上，新增自定义价格碟功能，允许用户输入任意价格并创建自定义碟，与固定价格碟独立管理、分别显示。

### 1.2 核心特性
- **独立队列管理**：自定义碟与固定碟使用两个独立的队列
- **无堆叠逻辑**：自定义碟直接按队列顺序计入总价，无堆叠显示
- **偶奇索引显示**：P1显示偶数索引，P2显示奇数索引
- **长按删除**：支持长按P1/P2中的碟子进行删除
- **渐进式增强**：保持现有代码完全不动，新增独立模块
- **当前版本范围**：仅实现俯视图的自定义碟功能，正视图暂不实现

### 1.3 使用场景
用户在餐厅遇到非标准价格的特价碟时，可以通过P3输入价格创建自定义碟，快速计入总价。

## 2. 架构设计

### 2.1 整体架构

```
现有代码 (app.js)
    ↓ 事件通信
CustomPlateModule (新模块)
    ├── CustomPlateManager (管理自定义碟队列)
    ├── CustomPlateRenderer (负责P1/P2/P3渲染)
    └── CustomPlateEvents (事件接口层)
```

### 2.2 设计原则
- **模块化**：自定义碟逻辑完全独立，不修改现有代码
- **事件驱动**：通过事件与主模块通信，降低耦合
- **渐进式**：可以独立开发、测试、部署
- **向后兼容**：不影响现有固定碟功能

### 2.3 布局设计

#### 俯视图（Top View）- 当前版本实现

```
┌─────────────────────────────────┐
│  P1 区域（偶数索引）             │  ← 绝对定位，z-index: 10
├─────────────────────────────────┤
│                                 │
│   固定碟堆叠显示区域             │  ← 现有逻辑，z-index: 1
│   (platesContainer)             │
│                                 │
├─────────────────────────────────┤
│ P2 区域（奇数索引）│ P3 区域  │  ← 绝对定位，z-index: 10
│     flex: 2        │  flex: 1  │
└─────────────────────────────────┘
```

**说明：**
- P1区域：显示偶数索引的自定义碟（索引0, 2, 4...）
- 固定碟区域：保持现有堆叠显示逻辑不变
- P2区域：显示奇数索引的自定义碟（索引1, 3, 5...）
- P3区域：价格输入框和确认按钮

#### 正视图（Front View）- 未来版本

**当前版本：** 正视图不显示自定义碟相关区域，保持现有固定碟堆叠显示不变。

**未来扩展：** 在后续版本中，可以在正视图右侧空白区域添加P1/P2/P3自定义碟显示区域。

### 2.4 层级管理

**关键修复：** 返回和总计按钮需要移到更高层级，避免被P1/P2/P3遮挡。

```html
<!-- 调整后的结构 -->
<div class="display-area">
    <!-- 按钮提升到 display-area 级别，z-index: 20 -->
    <button class="back-btn" style="z-index: 20;">返回</button>
    <button class="total-btn" style="z-index: 20;">总计</button>

    <div class="table-view top-view">
        <!-- P1/P2/P3 区域，z-index: 10 -->
        <div class="p1" style="z-index: 10;"></div>
        <div class="table-surface">
            <div class="plates-container"></div>
        </div>
        <div class="p2-p3-box" style="z-index: 10;">
            <div class="p2"></div>
            <div class="p3"></div>
        </div>
    </div>

    <!-- 正视图保持原样，不添加自定义碟区域 -->
    <div class="table-view front-view">
        <!-- 现有固定碟堆叠显示 -->
    </div>
</div>
```

**视图切换逻辑：**
- 切换到俯视图：显示P1/P2/P3区域
- 切换到正视图：隐藏P1/P2/P3区域（通过CSS控制）
- 自定义碟数据始终保留，只是视图切换时不显示

## 3. 组件设计

### 3.1 CustomPlateModule

**职责：**
- 管理自定义碟队列
- 渲染P1/P2/P3区域
- 处理长按删除
- 与主模块通过事件通信

**公共接口：**
```javascript
const CustomPlateModule = {
    // 初始化模块
    init()

    // 创建自定义碟
    addCustomPlate(price: number): boolean

    // 删除自定义碟
    removeCustomPlate(index: number): void

    // 获取自定义碟队列
    getCustomPlates(): Array<{id, price, createTime}>

    // 计算自定义碟总价
    calculateTotal(): number

    // 更新显示
    render(): void

    // 销毁模块
    destroy(): void
}
```

### 3.2 CustomPlateManager

**职责：** 管理自定义碟数据队列

```javascript
class CustomPlateManager {
    constructor()
    add(price)           // 添加碟子到队列
    remove(index)        // 从队列删除碟子
    getAll()             // 获取所有碟子
    getByIndex(index)    // 根据索引获取碟子
    calculateTotal()     // 计算总价
}
```

### 3.3 CustomPlateRenderer

**职责：** 负责P1/P2/P3的DOM渲染

```javascript
class CustomPlateRenderer {
    constructor(manager)
    renderP1()           // 渲染偶数索引碟子
    renderP2()           // 渲染奇数索引碟子
    renderP3()           // 渲染输入区域
    renderAll()          // 渲染全部区域
}
```

### 3.4 CustomPlateEvents

**职责：** 事件接口层，与主模块通信

```javascript
class CustomPlateEvents {
    emitAdded(plate)     // 触发碟子添加事件
    emitRemoved(index)   // 触发碟子删除事件
    onViewChange(view)   // 监听视图切换事件
}
```

## 4. 数据结构

### 4.1 自定义碟对象

```javascript
{
    id: number,          // 唯一标识符（时间戳）
    price: number,       // 价格（正整数）
    createTime: number   // 创建时间（时间戳）
}
```

### 4.2 自定义碟队列

```javascript
customPlates = [
    { id: 1740672000000, price: 5, createTime: 1740672000000 },
    { id: 1740672001000, price: 10, createTime: 1740672001000 },
    { id: 1740672002000, price: 20, createTime: 1740672002000 },
    { id: 1740672003000, price: 5, createTime: 1740672003000 },
    { id: 1740672004000, price: 15, createTime: 1740672004000 }
]

// P1显示（偶数索引）: [5, 20, 15]
// P2显示（奇数索引）: [10, 5]
// 总价: 5 + 10 + 20 + 5 + 15 = 55
```

### 4.3 显示规则

```javascript
// 偶数索引 → P1
const p1Plates = customPlates.filter((_, index) => index % 2 === 0)

// 奇数索引 → P2
const p2Plates = customPlates.filter((_, index) => index % 2 === 1)
```

## 5. 数据流

### 5.1 添加自定义碟流程

```
用户操作
  ↓
在P3输入价格 → 点击"确认"按钮
  ↓
CustomPlateModule.addCustomPlate(price)
  ↓
CustomPlateManager.add(price)
  ├── 验证价格（正数、非空）
  ├── 创建碟子对象 { id, price, createTime }
  └── 添加到队列
  ↓
CustomPlateRenderer.renderAll()
  ├── renderP1() - 渲染偶数索引
  ├── renderP2() - 渲染奇数索引
  └── renderP3() - 清空输入框
  ↓
CustomPlateEvents.emitAdded(plate)
  ↓
主模块监听 'customPlate:added'
  ↓
更新总价显示
```

### 5.2 删除自定义碟流程

```
用户操作
  ↓
长按P1或P2中的碟子（800ms）
  ↓
CustomPlateModule.removeCustomPlate(index)
  ↓
CustomPlateManager.remove(index)
  └── 从队列移除该碟子
  ↓
CustomPlateRenderer.renderAll()
  ├── 重新渲染P1
  └── 重新渲染P2
  ↓
CustomPlateEvents.emitRemoved(index)
  ↓
主模块监听 'customPlate:removed'
  ↓
更新总价显示
```

### 5.3 视图切换（当前版本）

**当前版本实现：** 通过CSS控制P1/P2/P3的显示/隐藏

```javascript
// 在主模块的视图切换函数中
function showFrontView() {
    // 隐藏俯视图的自定义碟区域
    document.querySelectorAll('.p1, .p2-p3-box').forEach(el => {
        el.style.display = 'none';
    });

    // 显示正视图（保持原有逻辑）
    document.getElementById('frontView').style.display = 'flex';
    document.getElementById('topView').style.display = 'none';
}

function showTopView() {
    // 显示俯视图的自定义碟区域
    document.querySelectorAll('.p1, .p2-p3-box').forEach(el => {
        el.style.display = '';
    });

    // 显示俯视图（保持原有逻辑）
    document.getElementById('frontView').style.display = 'none';
    document.getElementById('topView').style.display = 'block';
}
```

## 6. 事件接口

### 6.1 自定义碟模块触发的事件

```javascript
// 碟子添加事件
document.dispatchEvent(new CustomEvent('customPlate:added', {
    detail: { plate: { id, price, createTime } }
}))

// 碟子删除事件
document.dispatchEvent(new CustomEvent('customPlate:removed', {
    detail: { index: number, total: number }
}))
```

### 6.2 主模块监听事件

```javascript
// 监听自定义碟变化，更新总价
document.addEventListener('customPlate:added', (e) => {
    const customTotal = CustomPlateModule.calculateTotal()
    updateTotalDisplay(customTotal)
})

document.addEventListener('customPlate:removed', (e) => {
    const customTotal = CustomPlateModule.calculateTotal()
    updateTotalDisplay(customTotal)
})
```

## 7. 错误处理

### 7.1 输入验证

```javascript
// 价格验证规则
function validatePrice(price) {
    // 必须是数字
    if (typeof price !== 'number') {
        return { valid: false, message: '请输入数字' }
    }

    // 必须为正数
    if (price <= 0) {
        return { valid: false, message: '价格必须大于0' }
    }

    // 不能为空
    if (!price) {
        return { valid: false, message: '请输入价格' }
    }

    return { valid: true }
}
```

### 7.2 重复价格处理

允许相同价格存在，每个碟子都是独立对象（通过id区分）。

### 7.3 长按误触防护

```javascript
// 长按阈值：800ms
const LONG_PRESS_THRESHOLD = 800

let pressTimer = null

function handlePressStart(callback) {
    pressTimer = setTimeout(() => {
        callback()
    }, LONG_PRESS_THRESHOLD)
}

function handlePressEnd() {
    if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
    }
}
```

### 7.4 移动端触摸兼容

同时支持鼠标和触摸事件：

```javascript
// 统一事件处理
function setupLongPress(element, callback) {
    // 鼠标事件
    element.addEventListener('mousedown', handlePressStart)
    element.addEventListener('mouseup', handlePressEnd)
    element.addEventListener('mouseleave', handlePressEnd)

    // 触摸事件
    element.addEventListener('touchstart', handlePressStart)
    element.addEventListener('touchend', handlePressEnd)
    element.addEventListener('touchcancel', handlePressEnd)
}
```

## 8. 样式设计

### 8.1 自定义碟标签样式

```css
.custom-plate-tag {
    background: linear-gradient(145deg, #9b59b6, #8e44ad);
    color: white;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    user-select: none;
    cursor: pointer;
}

.custom-plate-tag .price {
    font-size: 16px;
}

.custom-plate-tag .hint {
    font-size: 10px;
    opacity: 0.7;
}
```

### 8.2 P3输入区域样式

```css
.p3-input-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
}

.p3-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
}

.p3-confirm-btn {
    width: 100%;
    padding: 10px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
}

.p3-confirm-btn:hover {
    background: #45a049;
}
```

### 8.3 移动端适配

```css
@media (max-width: 768px) {
    .p1,
    .p2-p3-box {
        height: 150px;  /* 缩小高度 */
    }

    .custom-plate-tag {
        padding: 6px 10px;
        font-size: 12px;
    }

    .custom-plate-tag .price {
        font-size: 14px;
    }

    .p3-input {
        font-size: 12px;
        padding: 6px;
    }

    .p3-confirm-btn {
        font-size: 12px;
        padding: 8px;
    }
}
```

## 9. 测试策略

### 9.1 单元测试

**CustomPlateManager测试：**
```javascript
// 测试添加碟子
test('add() 应该正确添加碟子到队列', () => {
    manager.add(25)
    expect(manager.getAll().length).toBe(1)
    expect(manager.getAll()[0].price).toBe(25)
})

// 测试删除碟子
test('remove() 应该正确删除指定索引的碟子', () => {
    manager.add(5)
    manager.add(10)
    manager.remove(0)
    expect(manager.getAll().length).toBe(1)
    expect(manager.getAll()[0].price).toBe(10)
})

// 测试总价计算
test('calculateTotal() 应该正确计算总价', () => {
    manager.add(5)
    manager.add(10)
    manager.add(20)
    expect(manager.calculateTotal()).toBe(35)
})
```

**CustomPlateRenderer测试：**
```javascript
// 测试偶数索引过滤
test('renderP1() 应该只渲染偶数索引的碟子', () => {
    manager.add(5)   // index 0 → P1
    manager.add(10)  // index 1 → P2
    manager.add(20)  // index 2 → P1
    const p1Plates = renderer.getP1Plates()
    expect(p1Plates).toEqual([5, 20])
})

// 测试奇数索引过滤
test('renderP2() 应该只渲染奇数索引的碟子', () => {
    manager.add(5)   // index 0
    manager.add(10)  // index 1 → P2
    manager.add(20)  // index 2
    const p2Plates = renderer.getP2Plates()
    expect(p2Plates).toEqual([10])
})
```

### 9.2 集成测试

**事件通信测试：**
```javascript
test('添加碟子时应该触发 customPlate:added 事件', () => {
    const handler = jest.fn()
    document.addEventListener('customPlate:added', handler)
    CustomPlateModule.addCustomPlate(25)
    expect(handler).toHaveBeenCalled()
    expect(handler.mock.calls[0][0].detail.plate.price).toBe(25)
})
```

**总价计算测试：**
```javascript
test('总价应该包含固定碟和自定义碟', () => {
    // 添加固定碟：白碟2个，红碟1个
    state.quantities.white = 2
    state.quantities.red = 1

    // 添加自定义碟：[5, 10, 20]
    CustomPlateModule.addCustomPlate(5)
    CustomPlateModule.addCustomPlate(10)
    CustomPlateModule.addCustomPlate(20)

    const fixedTotal = 2 * 8 + 1 * 10  // 26
    const customTotal = 5 + 10 + 20    // 35
    const total = fixedTotal + customTotal  // 61

    expect(calculateTotal()).toBe(61)
})
```

### 9.3 UI测试

**手动测试清单：**
- [ ] 在P3输入有效价格，点击确认，碟子正确添加到P1或P2
- [ ] 在P3输入无效价格（负数、空），显示错误提示
- [ ] 长按P1中的碟子，正确删除
- [ ] 长按P2中的碟子，正确删除
- [ ] 删除后，P1/P2正确重新渲染
- [ ] 总价正确更新（固定碟 + 自定义碟）
- [ ] 切换到正视图，P1/P2/P3区域正确隐藏
- [ ] 切换回俯视图，P1/P2/P3区域正确显示
- [ ] 移动端触摸操作正常
- [ ] 返回和总计按钮可以正常点击（不被遮挡）

## 10. 实现注意事项

### 10.1 文件结构

```
js/
├── app.js                    # 现有主逻辑（不修改）
├── custom-plate-module.js    # 新增：自定义碟模块
    ├── CustomPlateManager
    ├── CustomPlateRenderer
    └── CustomPlateEvents

css/
├── style.css                 # 现有样式（新增P1/P2/P3样式）
└── custom-plate.css          # 可选：独立样式文件

index.html                    # 新增P1/P2/P3 DOM结构
```

### 10.2 实现顺序

1. **阶段1：HTML结构调整**
   - 在俯视图添加P1/P2/P3 DOM结构
   - 调整返回和总计按钮位置和z-index
   - 添加基本样式边框
   - 在视图切换函数中添加P1/P2/P3显示/隐藏逻辑

2. **阶段2：CustomPlateManager实现**
   - 实现队列管理逻辑
   - 实现偶数/奇数索引过滤
   - 实现总价计算

3. **阶段3：CustomPlateRenderer实现**
   - 实现P1/P2渲染逻辑
   - 实现P3输入区域
   - 实现自定义碟标签样式

4. **阶段4：事件系统实现**
   - 实现CustomPlateEvents
   - 主模块添加事件监听
   - 更新总价计算逻辑

5. **阶段5：交互功能实现**
   - 实现添加碟子功能
   - 实现长按删除功能
   - 添加输入验证

6. **阶段6：移动端适配**
   - 添加响应式样式
   - 测试触摸事件
   - 调整尺寸和间距

7. **阶段7：测试和优化**
   - 单元测试
   - 集成测试
   - 性能优化
   - 用户体验优化

### 10.3 关键技术点

**DOM操作优化：**
- 使用DocumentFragment批量插入
- 避免频繁的DOM查询，缓存元素引用
- 使用事件委托处理长按删除

**性能优化：**
- 队列变化时才重新渲染
- 使用虚拟DOM思路（可选）
- 避免不必要的重排重绘

**兼容性：**
- 支持IE11+（如需要）
- 移动端Safari/Chrome兼容
- 触摸事件和鼠标事件兼容

### 10.4 代码规范

- 使用ES6+语法
- 遵循现有代码风格
- 添加必要的注释
- 错误处理要完善
- 避免全局变量污染

### 10.5 向后兼容

- 不修改现有的app.js核心逻辑
- 保持固定碟功能完全不变
- 如果自定义碟功能出错，不影响固定碟使用
- 可以通过配置开关禁用自定义碟功能（可选）

## 11. 未来扩展

### 11.1 可能的优化方向
- **正视图支持** - 在正视图右侧空白区域添加P1/P2/P3自定义碟显示区域
- 自定义碟的编辑功能（修改价格）
- 自定义碟的排序功能
- 自定义碟的保存到本地存储
- 自定义碟的预设模板
- 自定义碟的批量导入

### 11.2 数据持久化
- 考虑使用localStorage保存自定义碟队列
- 刷新页面后恢复数据
- 提供"清空自定义碟"功能

### 11.3 统计功能
- 记录自定义碟使用频率
- 常用价格快速选择
- 消费历史记录

## 12. 验收标准

### 12.1 功能完整性
- ✅ 用户可以在P3输入价格并创建自定义碟
- ✅ 自定义碟正确显示在P1（偶数）或P2（奇数）
- ✅ 用户可以长按删除自定义碟
- ✅ 总价正确包含固定碟和自定义碟
- ✅ 切换到正视图时，P1/P2/P3区域正确隐藏
- ✅ 切换到俯视图时，P1/P2/P3区域正确显示
- ✅ 返回和总计按钮可以正常点击（不被遮挡）

### 12.2 用户体验
- ✅ 输入验证友好，错误提示清晰
- ✅ 长按操作有视觉反馈
- ✅ 添加和删除动画流畅
- ✅ 移动端操作顺手
- ✅ 布局美观，不拥挤

### 12.3 代码质量
- ✅ 模块化清晰，职责分明
- ✅ 代码注释完善
- ✅ 错误处理健全
- ✅ 不影响现有功能
- ✅ 通过所有测试用例

---

**设计版本：** v1.1
**最后更新：** 2026-03-30
**更新内容：**
- 明确当前版本仅实现俯视图的自定义碟功能
- 移除正视图相关的设计内容
- 添加视图切换时的显示/隐藏逻辑
- 将正视图支持列入未来扩展计划
**状态：** 待审核
