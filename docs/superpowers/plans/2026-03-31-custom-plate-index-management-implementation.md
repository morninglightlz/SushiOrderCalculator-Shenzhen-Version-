# 自定义碟索引管理优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用双队列机制彻底解决自定义碟删除后索引重分配问题，优化UI布局，移除不必要的验证逻辑

**Architecture:** 将CustomPlateManager从单一队列改为双队列（p1Queue, p2Queue），新增碟子时智能分配到较短的队列（长度相同优先P1），删除碟子时只影响对应队列。CSS调整按钮位置，app.js移除验证逻辑。

**Tech Stack:** Vanilla JavaScript (ES6+), CSS3, DOM API

---

## 文件结构

### 修改的文件
- **js/custom-plate-module.js** - 双队列管理逻辑
  - CustomPlateManager类：从单一队列改为双队列
  - CustomPlateRenderer类：支持队列参数的渲染和删除

- **css/style.css** - UI布局调整
  - 清除按钮：bottom → top
  - 返回/总计按钮：top → bottom

- **js/app.js** - 移除验证逻辑
  - showFrontView()：移除碟子数量检查
  - clearData()：移除自动切换视图

### 新增的文件
无

---

## Task 1: 修改CustomPlateManager数据结构

**Files:**
- Modify: `js/custom-plate-module.js:5-124`

- [ ] **Step 1: 修改constructor，引入双队列结构**

找到 `constructor()` 方法，替换为：

```javascript
constructor() {
    // 双队列系统
    this.p1Queue = [];  // P1区域的碟子队列
    this.p2Queue = [];  // P2区域的碟子队列
    this.nextPlateId = 0;  // 全局ID计数器
}
```

- [ ] **Step 2: 删除旧的单一代码**

删除以下行（如果存在）：
```javascript
// 删除这行
this.customPlates = [];
```

- [ ] **Step 3: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: 将CustomPlateManager改为双队列结构

- 引入p1Queue和p2Queue替代单一customPlates
- 添加nextPlateId全局计数器

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 实现智能队列选择算法

**Files:**
- Modify: `js/custom-plate-module.js:5-124`

- [ ] **Step 1: 在CustomPlateManager类中添加selectTargetQueue方法**

在 `validatePrice()` 方法之后添加：

```javascript
/**
 * 选择目标队列用于添加新碟子
 * @returns {Array} 目标队列（p1Queue或p2Queue）
 */
selectTargetQueue() {
    const p1Length = this.p1Queue.length;
    const p2Length = this.p2Queue.length;

    // 如果都为空，使用交叉分配规则（基于已添加的总数）
    if (p1Length === 0 && p2Length === 0) {
        const totalAdded = this.nextPlateId;
        return totalAdded % 2 === 0 ? this.p1Queue : this.p2Queue;
    }

    // 插入较短的队列，相同时优先P1
    return p1Length <= p2Length ? this.p1Queue : this.p2Queue;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "feat: 添加智能队列选择算法

- 初始状态使用交叉分配（第1个→P1，第2个→P2）
- 删除后再新增时优先插入较短的队列
- 队列长度相同时优先插入P1

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 重写add方法支持双队列

**Files:**
- Modify: `js/custom-plate-module.js:16-32`

- [ ] **Step 1: 替换add方法实现**

找到 `add(price)` 方法，完整替换为：

```javascript
/**
 * 添加自定义碟到队列
 * @param {number} price - 碟子价格
 * @returns {Object|null} 返回创建的碟子对象，失败返回null
 */
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

    // 选择目标队列并添加
    const targetQueue = this.selectTargetQueue();
    targetQueue.push(plate);

    return plate;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "feat: 重写add方法支持双队列分配

- 使用selectTargetQueue()智能选择目标队列
- 碟子ID使用nextPlateId全局计数器
- 保持原有的价格验证逻辑

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 重写remove方法支持队列参数

**Files:**
- Modify: `js/custom-plate-module.js:34-45`

- [ ] **Step 1: 替换remove方法签名和实现**

找到 `remove(index)` 方法，完整替换为：

```javascript
/**
 * 从指定队列删除指定索引的碟子
 * @param {string} queueType - 队列类型 ('p1' 或 'p2')
 * @param {number} index - 碟子在队列中的索引
 * @returns {boolean} 删除成功返回true，失败返回false
 */
remove(queueType, index) {
    const queue = queueType === 'p1' ? this.p1Queue : this.p2Queue;

    if (index < 0 || index >= queue.length) {
        return false;
    }

    queue.splice(index, 1);
    return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "feat: 重写remove方法支持队列参数

- 添加queueType参数指定从哪个队列删除
- 保持原有的索引越界检查
- 只影响指定队列，不影响另一个队列

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 更新getP1Plates和getP2Plates方法

**Files:**
- Modify: `js/custom-plate-module.js:67-81`

- [ ] **Step 1: 简化getP1Plates方法**

找到 `getP1Plates()` 方法，替换为：

```javascript
/**
 * 获取P1队列的所有碟子
 * @returns {Array} P1队列的副本
 */
getP1Plates() {
    return [...this.p1Queue];
}
```

- [ ] **Step 2: 简化getP2Plates方法**

找到 `getP2Plates()` 方法，替换为：

```javascript
/**
 * 获取P2队列的所有碟子
 * @returns {Array} P2队列的副本
 */
getP2Plates() {
    return [...this.p2Queue];
}
```

- [ ] **Step 3: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: 简化getP1Plates和getP2Plates方法

- 直接返回对应队列的副本
- 移除原有的filter奇偶索引逻辑
- 配合双队列机制，性能更优

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: 更新getAll和clear方法

**Files:**
- Modify: `js/custom-plate-module.js:47-96`

- [ ] **Step 1: 更新getAll方法**

找到 `getAll()` 方法，替换为：

```javascript
/**
 * 获取所有自定义碟（P1 + P2）
 * @returns {Array} 所有碟子的副本
 */
getAll() {
    return [...this.p1Queue, ...this.p2Queue];
}
```

- [ ] **Step 2: 更新clear方法**

找到 `clear()` 方法，替换为：

```javascript
/**
 * 清空所有自定义碟
 */
clear() {
    this.p1Queue = [];
    this.p2Queue = [];
    this.nextPlateId = 0;
}
```

- [ ] **Step 3: 更新getLength方法**

找到 `getLength()` 方法，替换为：

```javascript
/**
 * 获取碟子总数
 * @returns {number} P1和P2的碟子总数
 */
getLength() {
    return this.p1Queue.length + this.p2Queue.length;
}
```

- [ ] **Step 4: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: 更新getAll、clear和getLength方法

- getAll返回P1和P2队列的合并数组
- clear清空两个队列并重置nextPlateId
- getLength返回两个队列的总长度

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 更新getByIndex方法

**Files:**
- Modify: `js/custom-plate-module.js:56-65`

- [ ] **Step 1: 删除getByIndex方法**

找到 `getByIndex(index)` 方法，完整删除它。

这个方法在双队列系统中不再需要，因为索引现在是相对于特定队列的，而不是全局的。

- [ ] **Step 2: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: 删除getByIndex方法

- 双队列系统中索引是队列相对的
- 不再需要全局索引访问方法
- 简化API接口

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: 修改CustomPlateRenderer渲染逻辑

**Files:**
- Modify: `js/custom-plate-module.js:168-216`

- [ ] **Step 1: 更新renderP1方法**

找到 `renderP1()` 方法，替换为：

```javascript
/**
 * 渲染P1区域（P1队列）
 */
renderP1() {
    if (!this.p1Container) return;

    const p1Plates = this.manager.getP1Plates();
    this.p1Container.innerHTML = '';

    if (p1Plates.length === 0) {
        this.p1Container.innerHTML = '<div style="color: #999; font-size: 12px; text-align: center; padding: 10px;">P1：偶数索引自定义碟</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    p1Plates.forEach((plate, index) => {
        const tag = this.createPlateTag(plate, index, 'p1');
        fragment.appendChild(tag);
    });

    this.p1Container.appendChild(fragment);
}
```

- [ ] **Step 2: 更新renderP2方法**

找到 `renderP2()` 方法，替换为：

```javascript
/**
 * 渲染P2区域（P2队列）
 */
renderP2() {
    if (!this.p2Container) return;

    const p2Plates = this.manager.getP2Plates();
    this.p2Container.innerHTML = '';

    if (p2Plates.length === 0) {
        this.p2Container.innerHTML = '<div style="color: #999; font-size: 12px; text-align: center; padding: 10px;">P2：奇数索引自定义碟</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    p2Plates.forEach((plate, index) => {
        const tag = this.createPlateTag(plate, index, 'p2');
        fragment.appendChild(tag);
    });

    this.p2Container.appendChild(fragment);
}
```

- [ ] **Step 3: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: 更新renderP1和renderP2方法

- 移除原有的奇偶索引计算逻辑
- 直接遍历对应队列的碟子
- 传递队列类型参数给createPlateTag

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: 更新createPlateTag方法

**Files:**
- Modify: `js/custom-plate-module.js:218-237`

- [ ] **Step 1: 修改createPlateTag方法签名和实现**

找到 `createPlateTag(plate, index)` 方法，替换为：

```javascript
/**
 * 创建自定义碟标签元素
 * @param {Object} plate - 碟子对象
 * @param {number} index - 在队列中的索引
 * @param {string} queueType - 队列类型 ('p1' 或 'p2')
 * @returns {HTMLElement} 碟子标签元素
 */
createPlateTag(plate, index, queueType) {
    const tag = document.createElement('div');
    tag.className = 'custom-plate-tag';
    tag.dataset.index = index;
    tag.dataset.queueType = queueType;
    tag.innerHTML = `
        <span class="price">¥${plate.price}</span>
        <span class="hint">长按删除</span>
    `;

    // 绑定长按删除事件
    this.bindLongPress(tag, index, queueType);

    return tag;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: 更新createPlateTag方法

- 添加queueType参数
- 在dataset中存储队列类型
- 传递队列类型给bindLongPress

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: 更新bindLongPress方法

**Files:**
- Modify: `js/custom-plate-module.js:322-369`

- [ ] **Step 1: 修改bindLongPress方法签名**

找到 `bindLongPress(element, index)` 方法，将签名改为：

```javascript
/**
 * 绑定长按删除事件
 * @param {HTMLElement} element - 要绑定的元素
 * @param {number} index - 碟子在队列中的索引
 * @param {string} queueType - 队列类型 ('p1' 或 'p2')
 */
bindLongPress(element, index, queueType) {
```

- [ ] **Step 2: 修改长按确认后的删除调用**

在同一方法内，找到确认删除的代码块：

```javascript
// 找到这一行
if (confirm('确定要删除这个碟子吗？')) {
    this.handleRemovePlate(index);
}
```

替换为：

```javascript
if (confirm('确定要删除这个碟子吗？')) {
    this.handleRemovePlate(index, queueType);
}
```

- [ ] **Step 3: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: 更新bindLongPress方法支持队列类型

- 添加queueType参数
- 传递队列类型给handleRemovePlate
- 支持从指定队列删除碟子

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 11: 更新handleRemovePlate方法

**Files:**
- Modify: `js/custom-plate-module.js:371-387`

- [ ] **Step 1: 修改handleRemovePlate方法签名和实现**

找到 `handleRemovePlate(index)` 方法，完整替换为：

```javascript
/**
 * 处理删除碟子
 * @param {number} index - 碟子在队列中的索引
 * @param {string} queueType - 队列类型 ('p1' 或 'p2')
 */
handleRemovePlate(index, queueType) {
    const success = this.manager.remove(queueType, index);
    if (success) {
        // 重新渲染P1和P2
        this.renderP1();
        this.renderP2();

        // 触发回调
        if (this.onRemoveCallback) {
            this.onRemoveCallback(index, queueType);
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "feat: 更新handleRemovePlate方法

- 添加queueType参数
- 调用manager.remove(queueType, index)
- 传递队列类型给回调函数

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 12: 更新removeCustomPlate公开API

**Files:**
- Modify: `js/custom-plate-module.js:508-525`

- [ ] **Step 1: 修改removeCustomPlate方法**

找到 `removeCustomPlate(index)` 方法，替换为：

```javascript
/**
 * 删除自定义碟（公开API）
 * @param {string} queueType - 队列类型 ('p1' 或 'p2')
 * @param {number} index - 碟子在队列中的索引
 * @returns {boolean} 成功返回true，失败返回false
 */
function removeCustomPlate(queueType, index) {
    if (!initialized) {
        console.error('CustomPlateModule: 未初始化');
        return false;
    }

    const success = manager.remove(queueType, index);
    if (success) {
        renderer.renderAll();
        return true;
    }
    return false;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "feat: 更新removeCustomPlate公开API

- 添加queueType参数
- 保持API的一致性
- 更新文档注释

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 13: 更新事件回调参数

**Files:**
- Modify: `js/custom-plate-module.js:474-483`

- [ ] **Step 1: 修改删除事件回调**

找到删除事件触发的代码块：

```javascript
renderer.onRemove((index) => {
    // 触发删除事件
    document.dispatchEvent(new CustomEvent('customPlate:removed', {
        detail: {
            index: index,
            total: manager.calculateTotal()
        }
    }));
});
```

替换为：

```javascript
renderer.onRemove((index, queueType) => {
    // 触发删除事件
    document.dispatchEvent(new CustomEvent('customPlate:removed', {
        detail: {
            index: index,
            queueType: queueType,
            total: manager.calculateTotal()
        }
    }));
});
```

- [ ] **Step 2: Commit**

```bash
git add js/custom-plate-module.js
git commit -m "feat: 更新删除事件回调

- 添加queueType到事件detail
- 保持事件接口的完整性
- 支持外部监听器获取队列信息

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 14: 调整清除按钮位置到右上角

**Files:**
- Modify: `css/style.css:154-170`

- [ ] **Step 1: 修改.clear-btn样式**

找到 `.clear-btn` 样式块，将 `bottom` 改为 `top`：

```css
/* 清除按钮 */
.clear-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(231, 76, 60, 0.9);
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;
    color: white;
    z-index: 20;
}
```

关键修改：
- 删除 `bottom: 10px;`
- 添加 `top: 10px;`
- 添加 `z-index: 20;` 确保在其他元素之上

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "style: 将清除按钮移至右上角

- 从底部改为顶部定位
- 添加z-index确保在P1/P2/P3之上
- 提升按钮可见性

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 15: 调整返回按钮位置到底部左侧

**Files:**
- Modify: `css/style.css:134-151`

- [ ] **Step 1: 修改.back-btn样式**

找到 `.back-btn` 样式块，将 `top` 改为 `bottom`：

```css
/* 返回按钮 */
.back-btn {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(46, 204, 113, 0.9);
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    z-index: 20;
    transition: background 0.2s;
    color: white;
}
```

关键修改：
- 删除 `top: 20px;`
- 添加 `bottom: 20px;`

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "style: 将返回按钮移至底部左侧

- 从顶部改为底部定位
- 与总计按钮形成底部布局
- 保持z-index层级

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 16: 调整总计按钮位置到底部右侧

**Files:**
- Modify: `css/style.css:172-190`

- [ ] **Step 1: 修改.total-btn样式**

找到 `.total-btn` 样式块，将 `top` 改为 `bottom`：

```css
/* 总计按钮 */
.total-btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(255, 215, 0, 0.9);
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    z-index: 20;
    transition: background 0.2s;
}
```

关键修改：
- 删除 `top: 20px;`
- 添加 `bottom: 20px;`

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "style: 将总计按钮移至底部右侧

- 从顶部改为底部定位
- 与返回按钮并排显示
- 完成底部按钮布局

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 17: 移除总计按钮的验证逻辑

**Files:**
- Modify: `js/app.js:338-355`

- [ ] **Step 1: 修改showFrontView方法**

找到 `showFrontView()` 方法，删除碟子数量检查：

```javascript
// 显示正视图
function showFrontView() {
    // 删除这些行
    // if (state.plateOrder.length === 0 && typeof CustomPlateModule !== 'undefined' && CustomPlateModule.getCustomPlates().length === 0) {
    //     alert('请先添加碟子！');
    //     return;
    // }

    state.currentView = 'front';
    elements.topView.style.display = 'none';
    elements.frontView.style.display = 'flex';
    elements.backBtn.style.display = 'block';
    elements.totalBtn.style.display = 'none';

    // 隐藏俯视图的自定义碟区域
    document.querySelectorAll('.p1, .p2-p3-box').forEach(el => el.style.display = 'none');

    updateFrontView();
}
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "refactor: 移除showFrontView的碟子数量验证

- 删除alert提示逻辑
- 允许在没有碟子时切换到正视图
- 简化用户交互流程

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 18: 移除清除数据后的自动视图切换

**Files:**
- Modify: `js/app.js:371-405`

- [ ] **Step 1: 修改clearData方法**

找到 `clearData()` 方法，删除自动切换视图的代码：

```javascript
// 清除数据
function clearData() {
    const hasFixedPlates = state.plateOrder.length > 0;
    const hasCustomPlates = typeof CustomPlateModule !== 'undefined' && CustomPlateModule.getCustomPlates().length > 0;

    if (!hasFixedPlates && !hasCustomPlates) {
        return;
    }

    // 确认是否清除
    if (!confirm('确定要清除所有数据吗？')) {
        return;
    }

    // 重置所有数量
    for (const color in state.quantities) {
        state.quantities[color] = 0;
    }

    // 清空点击顺序
    state.plateOrder = [];

    // 清空自定义碟
    if (typeof CustomPlateModule !== 'undefined') {
        CustomPlateModule.clear();
    }

    // 删除这些行
    // // 如果在正视图，先返回俯视图
    // if (state.currentView === 'front') {
    //     showTopView();
    // }

    // 更新所有显示（包括数量）
    updateDisplay();
}
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "refactor: 移除clearData的自动视图切换

- 删除清除后自动返回俯视图的逻辑
- 保持用户当前视图状态
- 提供更可控的用户体验

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 19: 更新移动端响应式样式

**Files:**
- Modify: `css/style.css:410-531`

- [ ] **Step 1: 检查移动端按钮样式**

查看移动端媒体查询中的按钮样式，确保与新的底部布局一致。

找到 `@media (max-width: 768px)` 块内的按钮样式，验证：
- `.back-btn` 应该有 `bottom: 10px; left: 10px;`
- `.total-btn` 应该有 `bottom: 10px; right: 10px;`
- `.clear-btn` 应该有 `top: 8px; right: 8px;`

如果样式不正确，进行相应调整。

- [ ] **Step 2: 检查超小屏幕样式**

查看 `@media (max-width: 375px)` 块内的按钮样式，确保一致性。

- [ ] **Step 3: Commit（如果有修改）**

```bash
git add css/style.css
git commit -m "style: 更新移动端响应式按钮布局

- 确保移动端按钮位置与桌面端一致
- 统一bottom定位在小屏幕上的表现
- 优化移动端用户体验

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 20: 手动测试所有功能

**Files:**
- No file changes

- [ ] **Step 1: 测试双队列添加逻辑**

1. 打开应用 `index.html`
2. 添加4个自定义碟（价格分别为10, 20, 30, 40）
3. 验证：
   - 第1个碟子（10元）出现在P1
   - 第2个碟子（20元）出现在P2
   - 第3个碟子（30元）出现在P1
   - 第4个碟子（40元）出现在P2

- [ ] **Step 2: 测试删除后不重分配**

1. 长按删除P1的第1个碟子（10元）
2. 验证：
   - P1剩余1个碟子（30元）
   - P2仍然有2个碟子（20元、40元）
   - P2的碟子位置没有变化

- [ ] **Step 3: 测试新增智能分配**

1. 添加1个新碟子（价格50）
2. 验证：
   - 新碟子添加到P1（因为P1长度1 < P2长度2）
   - P1现在有2个碟子
   - P2仍然有2个碟子

- [ ] **Step 4: 测试UI布局**

1. 验证清除按钮在右上角
2. 验证返回按钮在底部左侧
3. 验证总计按钮在底部右侧
4. 切换到正视图，验证按钮位置正确

- [ ] **Step 5: 测试移除的验证逻辑**

1. 清除所有碟子
2. 点击"总计"按钮
3. 验证：没有弹出"请添加碟子"的提示
4. 在正视图点击"清除"按钮
5. 验证：没有自动切换回俯视图

- [ ] **Step 6: 测试固定碟功能不受影响**

1. 添加几个固定碟（白碟、红碟等）
2. 验证固定碟的添加、删除、堆叠显示正常
3. 验证总价计算包含固定碟和自定义碟

- [ ] **Step 7: 测试移动端响应式**

1. 使用浏览器开发者工具切换到移动视图（iPhone尺寸）
2. 验证所有按钮位置正确
3. 验证触摸交互正常工作

- [ ] **Step 8: 记录测试结果**

创建测试笔记文件（可选）：

```bash
# 如果发现bug，记录到文件
echo "测试日期: $(date)" > test-notes.md
echo "所有测试通过 ✅" >> test-notes.md
```

---

## Task 21: 提交最终版本

**Files:**
- All modified files

- [ ] **Step 1: 查看所有更改**

```bash
git status
git diff --stat
```

- [ ] **Step 2: 创建最终提交**

```bash
git add .
git commit -m "feat: 完成自定义碟索引管理优化

✨ 新功能:
- 双队列机制彻底解决索引重分配问题
- 智能队列分配算法（交叉分配 + 短队列优先）
- UI布局优化：清除→右上角，返回/总计→底部

🐛 修复:
- 删除碟子后其他碟子位置跳动的问题
- P1/P2区域分布不稳定的问题

♻️ 重构:
- CustomPlateManager从单队列改为双队列
- 简化getP1Plates和getP2Plates实现
- 移除不必要的验证逻辑

📝 文档:
- 设计文档: docs/superpowers/specs/2026-03-31-*.md
- 实施计划: docs/superpowers/plans/2026-03-31-*.md

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 3: 查看提交历史**

```bash
git log --oneline -10
```

验证所有任务提交都在历史中。

---

## 完成检查清单

在实施完成后，验证以下内容：

- [ ] 双队列系统正常工作（P1/P2独立）
- [ ] 添加碟子时智能分配到较短的队列
- [ ] 删除碟子不影响其他队列
- [ ] 清除按钮在右上角
- [ ] 返回/总计按钮在底部
- [ ] 没有碟子时点击总计不弹出alert
- [ ] 清除数据后不自动切换视图
- [ ] 固定碟功能正常
- [ ] 移动端响应式正常
- [ ] 所有代码已提交到git

---

## 附录：关键设计决策

### 为什么选择双队列而非固定索引？

**双队列方案优势**：
- 逻辑更清晰，易于理解和维护
- 性能更好，不需要索引计算和映射
- 彻底隔离P1和P2，互不影响
- 易于扩展（未来可添加P3、P4等区域）

**固定索引方案劣势**：
- 需要维护索引与区域的映射关系
- 删除后产生"空洞"，需要特殊处理
- 代码复杂度高，易出错

### 为什么"短队列优先"而非"严格交叉"？

初始使用交叉分配是为了均匀分布。但删除操作会打破平衡，此时使用"短队列优先"可以：
- 自动恢复P1/P2的平衡
- 简化用户心智模型
- 避免复杂的再平衡算法

### UI布局为什么这样调整？

1. **清除按钮→右上角**：更符合用户习惯，避免误触
2. **返回/总计→底部**：释放顶部空间，让P1/P2区域更大
3. **保持并排**：返回/总计都是导航操作，放在一起更合理

---

**实施计划完成**
