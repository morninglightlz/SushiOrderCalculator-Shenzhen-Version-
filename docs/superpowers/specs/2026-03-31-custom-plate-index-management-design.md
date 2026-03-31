# 自定义碟索引管理优化设计

**日期**: 2026-03-31
**状态**: 设计阶段
**作者**: Claude Sonnet

## 问题背景

当前自定义碟模块使用单一队列管理所有碟子，通过索引的奇偶性分配到P1/P2区域。这导致以下问题：

1. **索引重分配问题**：删除某个碟子后，后续碟子的索引会重新计算，导致碟子在P1/P2之间"跳动"
2. **用户体验差**：用户添加碟子后，可能因为删除操作导致碟子位置发生变化
3. **逻辑复杂**：需要维护索引与区域的映射关系

## 设计方案

### 核心思路

使用**双队列机制**完全隔离P1和P2区域，彻底解决索引重分配问题。

### 数据结构

```javascript
{
  p1Queue: [plate1, plate3, ...],  // P1区域的碟子队列
  p2Queue: [plate2, plate4, ...],  // P2区域的碟子队列
  nextPlateId: 5                    // 全局ID计数器
}
```

每个碟子对象结构：
```javascript
{
  id: 0,              // 全局唯一ID
  price: 15,          // 碟子价格
  createTime: 123456  // 创建时间戳
}
```

### 新增碟子分配逻辑

#### 规则

1. **初始交叉分配**（两个队列都为空时）：
   - 第1个碟子 → P1
   - 第2个碟子 → P2
   - 第3个碟子 → P1
   - 第4个碟子 → P2
   - 以此类推...

2. **删除后再新增**：
   - 比较P1和P2队列的长度
   - 插入长度较短的队列
   - 如果长度相同，优先插入P1

#### 示例流程

```
初始状态：
  P1: []
  P2: []

添加4个碟子（交叉分配）：
  P1: [id:0, id:2]
  P2: [id:1, id:3]

删除P1的id:0：
  P1: [id:2]
  P2: [id:1, id:3]

新增碟子（P1长度1 < P2长度2，插入P1）：
  P1: [id:2, id:4]
  P2: [id:1, id:3]

再新增碟子（P1长度2 = P2长度2，优先P1）：
  P1: [id:2, id:4, id:5]
  P2: [id:1, id:3]
```

### 删除碟子逻辑

**实现**：
- 用户长按某个碟子
- 从对应的队列（P1或P2）中移除该碟子
- 另一个队列完全不受影响
- 后续新增碟子按"短队列优先"规则分配

**优势**：
- 彻底避免索引重分配
- 删除操作不影响其他碟子的位置
- 逻辑清晰，易于理解和维护

## UI布局调整

### 当前布局问题

- 返回/总计按钮在顶部，占用空间
- 清除按钮在右下角，不够明显

### 新布局设计

**垂直布局顺序**（从上到下）：
1. 清除按钮（右上角，control-panel内）
2. P1区域（顶部，height: 200px）
3. P2-P3并排区域（底部，height: 200px）
4. 返回和总计按钮（页面最底部，display-area底部）

### CSS修改要点

```css
/* 清除按钮：移至右上角 */
.clear-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  /* 移除 bottom: 10px */
}

/* 返回按钮：移至底部左侧 */
.back-btn {
  position: absolute;
  bottom: 20px;
  left: 20px;
  /* 移除 top: 20px */
}

/* 总计按钮：移至底部右侧 */
.total-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  /* 移除 top: 20px */
}
```

## 移除验证逻辑

### 问题

当前代码有两处不必要的验证逻辑：
1. 点击"总计"按钮时，如果没有碟子会弹出alert提示
2. 清除数据后，会自动从正视图切换回俯视图

### 解决方案

**修改文件**: [js/app.js](js/app.js)

1. **移除showFrontView()的验证**：
   ```javascript
   // 删除这段代码
   if (state.plateOrder.length === 0 && ...) {
       alert('请先添加碟子！');
       return;
   }
   ```

2. **移除clearData()的自动切换**：
   ```javascript
   // 删除这段代码
   if (state.currentView === 'front') {
       showTopView();
   }
   ```

## 代码变更范围

### 1. js/custom-plate-module.js

**CustomPlateManager类**：
- 添加 `p1Queue` 和 `p2Queue` 替代单一的 `customPlates`
- 修改 `add()` 方法：实现智能分配逻辑
- 修改 `remove()` 方法：支持从指定队列删除
- 修改 `getP1Plates()` 和 `getP2Plates()`：直接返回对应队列
- 保持 `calculateTotal()` 不变：计算两个队列的总和

**CustomPlateRenderer类**：
- 修改 `renderP1()` 和 `renderP2()`：渲染对应队列
- 修改 `createPlateTag()`：添加队列标识参数
- 修改 `handleRemovePlate()`：支持队列参数

### 2. css/style.css

- 调整 `.clear-btn` 位置（top: 10px, right: 10px）
- 调整 `.back-btn` 位置（bottom: 20px, left: 20px）
- 调整 `.total-btn` 位置（bottom: 20px, right: 20px）
- 确保z-index正确，按钮在P1/P2/P3之上

### 3. js/app.js

- 修改 `showFrontView()`：移除碟子数量检查
- 修改 `clearData()`：移除自动切换视图逻辑

## 技术细节

### 双队列添加碟子算法

```javascript
add(price) {
    // 验证价格
    if (!this.validatePrice(price).valid) {
        return null;
    }

    // 创建碟子对象
    const plate = {
        id: this.nextPlateId++,
        price: price,
        createTime: Date.now()
    };

    // 决定添加到哪个队列
    const targetQueue = this.selectTargetQueue();

    // 添加到目标队列
    targetQueue.push(plate);

    return plate;
}

selectTargetQueue() {
    const p1Length = this.p1Queue.length;
    const p2Length = this.p2Queue.length;

    // 如果都为空，使用交叉分配规则
    if (p1Length === 0 && p2Length === 0) {
        const totalAdded = this.nextPlateId;
        return totalAdded % 2 === 0 ? this.p1Queue : this.p2Queue;
    }

    // 插入较短的队列，相同时优先P1
    return p1Length <= p2Length ? this.p1Queue : this.p2Queue;
}
```

### 删除碟子算法

```javascript
remove(queueType, index) {
    const queue = queueType === 'p1' ? this.p1Queue : this.p2Queue;

    if (index < 0 || index >= queue.length) {
        return false;
    }

    queue.splice(index, 1);
    return true;
}
```

## 优势分析

✅ **彻底解决索引重分配问题**：双队列完全独立，互不影响
✅ **逻辑清晰**：比固定索引方案更易理解和维护
✅ **性能优化**：不需要复杂的索引计算和映射
✅ **用户体验好**：碟子保持在原区域，不会"跳动"
✅ **易于扩展**：未来如果需要添加更多区域（如P3、P4），可以轻松扩展

## 测试要点

1. **新增碟子**：
   - 初始添加多个碟子，验证交叉分配
   - 删除部分碟子后添加，验证"短队列优先"规则
   - 队列长度相同时添加，验证优先P1

2. **删除碟子**：
   - 从P1删除碟子，验证P2不受影响
   - 从P2删除碟子，验证P1不受影响
   - 验证删除后新增碟子的分配逻辑

3. **UI布局**：
   - 验证清除按钮在右上角
   - 验证返回/总计按钮在底部
   - 验证按钮在P1/P2/P3之上

4. **验证逻辑移除**：
   - 没有碟子时点击总计，验证不弹出alert
   - 在正视图清除数据，验证不自动切换回俯视图

## 实施计划

详见实施计划文档：`docs/superpowers/plans/2026-03-31-custom-plate-index-management-implementation.md`
