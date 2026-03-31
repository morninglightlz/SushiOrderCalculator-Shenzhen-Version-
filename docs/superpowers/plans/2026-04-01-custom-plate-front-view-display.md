# 正视图自定义碟显示功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 使正视图的P1/P2/P3区域具备与俯视图完全相同的自定义碟显示和交互功能，两个视图的数据保持实时同步。

**架构:** 修改 `CustomPlateRenderer` 类，使用精确选择器（`#topView .p1`, `#frontView .p1` 等）获取两套独立的容器引用，数据变更时同时渲染到两个视图。通过父容器的display属性控制视图显示/隐藏，移除手动控制P1/P2/P3显示的代码。

**技术栈:** 原生JavaScript (ES6+), CSS3, DOM API

---

## 文件结构

本计划涉及以下文件的修改：

1. **js/custom-plate-module.js** - CustomPlateRenderer类改造
   - 修改构造函数：添加6个容器引用（俯视图和正视图各3个）
   - 修改init()：使用精确选择器获取容器
   - 修改renderP1()：同时渲染到两个视图
   - 修改renderP2()：同时渲染到两个视图
   - 修改renderP3()：为两个视图创建输入区域
   - 添加renderP3Input()：辅助方法，为单个容器创建P3输入区域
   - 修改clear()：清空所有6个容器
   - 修改destroy()：清理所有6个容器的引用

2. **js/app.js** - 视图切换逻辑修改
   - 修改showFrontView()：移除手动控制P1/P2/P3显示的代码
   - 修改showTopView()：移除手动控制P1/P2/P3显示的代码

---

## Task 1: 修改CustomPlateRenderer构造函数

**文件:**
- Modify: `js/custom-plate-module.js:147-160`

**目标:** 添加6个容器引用属性，替代原来的3个通用容器引用。

- [ ] **Step 1: 备份当前构造函数代码**

在修改前，先备份当前的constructor代码以便对比。

当前代码（147-160行）：
```javascript
constructor(manager) {
    this.manager = manager;
    this.p1Container = null;
    this.p2Container = null;
    this.p3Container = null;
    this.onAddCallback = null;
    this.onRemoveCallback = null;
    this.boundElements = []; // 追踪绑定过长按事件的元素

    // 长按相关
    this.LONG_PRESS_THRESHOLD = 800; // 800ms触发长按
    this.pressTimer = null;
}
```

- [ ] **Step 2: 修改构造函数，替换容器属性**

将 `p1Container`, `p2Container`, `p3Container` 替换为6个独立的容器属性：

```javascript
constructor(manager) {
    this.manager = manager;
    // 俯视图容器
    this.topP1Container = null;
    this.topP2Container = null;
    this.topP3Container = null;
    // 正视图容器
    this.frontP1Container = null;
    this.frontP2Container = null;
    this.frontP3Container = null;
    this.onAddCallback = null;
    this.onRemoveCallback = null;
    this.boundElements = []; // 追踪绑定过长按事件的元素

    // 长按相关
    this.LONG_PRESS_THRESHOLD = 800; // 800ms触发长按
    this.pressTimer = null;
}
```

- [ ] **Step 3: 在浏览器中测试页面加载**

打开 `index.html`，打开浏览器控制台，检查是否有JavaScript错误。

预期：页面正常加载，控制台无错误。

- [ ] **Step 4: 提交更改**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: CustomPlateRenderer添加双视图容器引用

- 将p1Container/p2Container/p3Container替换为6个独立容器
- 添加topP1Container/topP2Container/topP3Container（俯视图）
- 添加frontP1Container/frontP2Container/frontP3Container（正视图）

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 修改CustomPlateRenderer的init()方法

**文件:**
- Modify: `js/custom-plate-module.js:163-181`

**目标:** 使用精确选择器获取两套独立的容器引用。

- [ ] **Step 1: 修改init()方法中的容器获取逻辑**

将原来的 `document.querySelector('.p1')` 替换为精确选择器：

```javascript
/**
 * 初始化渲染器，获取DOM元素引用
 */
init() {
    // 获取俯视图容器
    this.topP1Container = document.querySelector('#topView .p1');
    this.topP2Container = document.querySelector('#topView .p2');
    this.topP3Container = document.querySelector('#topView .p3');

    // 获取正视图容器
    this.frontP1Container = document.querySelector('#frontView .p1');
    this.frontP2Container = document.querySelector('#frontView .p2');
    this.frontP3Container = document.querySelector('#frontView .p3');

    // 验证俯视图容器
    if (!this.topP1Container || !this.topP2Container || !this.topP3Container) {
        console.error('CustomPlateRenderer: 找不到俯视图P1/P2/P3容器');
    }

    // 验证正视图容器
    if (!this.frontP1Container || !this.frontP2Container || !this.frontP3Container) {
        console.error('CustomPlateRenderer: 找不到正视图P1/P2/P3容器');
    }

    // 至少需要一个视图的容器完整才能继续
    if ((!this.topP1Container || !this.topP2Container || !this.topP3Container) &&
        (!this.frontP1Container || !this.frontP2Container || !this.frontP3Container)) {
        console.error('CustomPlateRenderer: 没有可用的完整视图容器');
        return;
    }

    // 渲染P3输入区域（两个视图）
    this.renderP3();

    // 初始渲染P1和P2（两个视图）
    this.renderP1();
    this.renderP2();
}
```

- [ ] **Step 2: 在浏览器中测试初始化**

刷新页面，打开浏览器控制台，检查：

1. 是否有 "CustomPlateRenderer: 找不到俯视图P1/P2/P3容器" 错误
2. 是否有 "CustomPlateRenderer: 找不到正视图P1/P2/P3容器" 错误
3. 是否有 "CustomPlateRenderer: 没有可用的完整视图容器" 错误

预期：无错误，或者只有预期的错误（如果某个视图的容器确实不存在）。

- [ ] **Step 3: 提交更改**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: CustomPlateRenderer使用精确选择器获取容器

- 使用#topView .p1/.p2/.p3获取俯视图容器
- 使用#frontView .p1/.p2/.p3获取正视图容器
- 添加容器验证和错误处理
- 至少需要一个视图的容器完整才能继续

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 添加renderP3Input()辅助方法

**文件:**
- Modify: `js/custom-plate-module.js` (在renderP3()方法之前插入)

**目标:** 创建一个辅助方法，为单个容器创建P3输入区域，避免代码重复。

- [ ] **Step 1: 在renderP3()方法之前插入renderP3Input()方法**

在 `renderP3()` 方法定义之前（大约240行处）插入以下代码：

```javascript
/**
 * 为单个容器渲染P3输入区域
 * @param {HTMLElement} container - 目标容器
 * @param {string} viewName - 视图名称（用于日志）
 */
renderP3Input(container, viewName) {
    if (!container) {
        console.warn(`CustomPlateRenderer: ${viewName} P3容器不存在，跳过渲染`);
        return;
    }

    container.innerHTML = `
        <div class="p3-input-container">
            <input
                type="number"
                class="p3-input"
                placeholder="输入价格"
                min="1"
                step="1"
            />
            <button class="p3-confirm-btn">确认</button>
            <div class="p3-error" style="color: #e74c3c; font-size: 12px; min-height: 16px; margin-top: 4px;"></div>
        </div>
    `;

    // 绑定添加事件
    const input = container.querySelector('.p3-input');
    const confirmBtn = container.querySelector('.p3-confirm-btn');
    const errorDiv = container.querySelector('.p3-error');

    // 安全检查
    if (!input || !confirmBtn || !errorDiv) {
        console.error(`CustomPlateRenderer: ${viewName} P3区域元素不完整`);
        return;
    }

    // 按钮点击事件
    confirmBtn.addEventListener('click', () => {
        this.handleAddPlate(input, errorDiv);
    });

    // 输入框回车事件
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            this.handleAddPlate(input, errorDiv);
        }
    });
}
```

- [ ] **Step 2: 在浏览器中测试（预期会有错误）**

刷新页面，打开控制台。此时页面可能还没有完全工作，因为我们还没有修改renderP3()来调用这个新方法。

预期：可能有JavaScript错误，或者renderP3()仍然使用旧逻辑。

- [ ] **Step 3: 提交更改**

```bash
git add js/custom-plate-module.js
git commit -m "feat: 添加renderP3Input辅助方法

- 为单个容器创建P3输入区域
- 支持视图名称参数用于日志
- 复用handleAddPlate逻辑

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 修改renderP3()方法调用renderP3Input()

**文件:**
- Modify: `js/custom-plate-module.js:240-282`

**目标:** 修改renderP3()方法，为两个视图分别调用renderP3Input()。

- [ ] **Step 1: 替换renderP3()方法的实现**

将当前的renderP3()方法（240-282行）替换为：

```javascript
/**
 * 渲染P3输入区域（两个视图）
 */
renderP3() {
    // 渲染俯视图P3
    this.renderP3Input(this.topP3Container, '俯视图');

    // 渲染正视图P3
    this.renderP3Input(this.frontP3Container, '正视图');
}
```

- [ ] **Step 2: 在浏览器中测试P3输入区域**

1. 刷新页面
2. 检查俯视图的P3区域是否有输入框和确认按钮
3. 切换到正视图（点击"总计"按钮）
4. 检查正视图的P3区域是否有输入框和确认按钮

预期：两个视图的P3区域都有完整的输入界面。

- [ ] **Step 3: 测试添加功能**

在俯视图的P3输入框中输入价格（例如：25），点击确认按钮。

预期：
- 输入框清空
- 俯视图的P1区域出现一个新标签（显示¥25）
- **此时正视图可能还没有显示，因为renderP1()和renderP2()还未修改**

- [ ] **Step 4: 提交更改**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: renderP3调用renderP3Input渲染两个视图

- 简化renderP3方法
- 为俯视图和正视图分别渲染P3输入区域
- 移除重复的HTML和事件绑定代码

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 修改renderP1()方法同时渲染到两个视图

**文件:**
- Modify: `js/custom-plate-module.js:184-200`

**目标:** 修改renderP1()方法，同时渲染到俯视图和正视图的P1容器。

- [ ] **Step 1: 替换renderP1()方法的实现**

将当前的renderP1()方法（184-200行）替换为：

```javascript
/**
 * 渲染P1区域（偶数索引自定义碟）- 同时渲染到两个视图
 */
renderP1() {
    const p1Plates = this.manager.getP1Plates();

    // 渲染到俯视图
    this.renderP1ToContainer(this.topP1Container, p1Plates);

    // 渲染到正视图
    this.renderP1ToContainer(this.frontP1Container, p1Plates);
}
```

- [ ] **Step 2: 添加renderP1ToContainer()辅助方法**

在renderP1()方法之后插入以下代码：

```javascript
/**
 * 为单个容器渲染P1区域
 * @param {HTMLElement} container - 目标容器
 * @param {Array} p1Plates - P1碟子数组
 */
renderP1ToContainer(container, p1Plates) {
    if (!container) {
        return; // 容器不存在，跳过渲染
    }

    container.innerHTML = '';

    if (p1Plates.length === 0) {
        container.innerHTML = '<div style="color: #999; font-size: 12px; text-align: center; padding: 10px;"></div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    p1Plates.forEach((plate, index) => {
        const tag = this.createPlateTag(plate, index, 'p1');
        fragment.appendChild(tag);
    });
    container.appendChild(fragment);
}
```

- [ ] **Step 3: 在浏览器中测试P1显示**

1. 刷新页面
2. 在俯视图的P3输入框输入价格并确认
3. 检查俯视图的P1区域是否显示新标签
4. 切换到正视图，检查P1区域是否也显示相同的标签

预期：两个视图的P1区域都显示相同的碟子标签。

- [ ] **Step 4: 提交更改**

```bash
git add js/custom-plate-module.js
git commit -m "feat: renderP1同时渲染到俯视图和正视图

- 添加renderP1ToContainer辅助方法
- renderP1调用两次renderP1ToContainer
- 确保两个视图的P1区域同步显示

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: 修改renderP2()方法同时渲染到两个视图

**文件:**
- Modify: `js/custom-plate-module.js:203-219`

**目标:** 修改renderP2()方法，同时渲染到俯视图和正视图的P2容器。

- [ ] **Step 1: 替换renderP2()方法的实现**

将当前的renderP2()方法（203-219行）替换为：

```javascript
/**
 * 渲染P2区域（奇数索引自定义碟）- 同时渲染到两个视图
 */
renderP2() {
    const p2Plates = this.manager.getP2Plates();

    // 渲染到俯视图
    this.renderP2ToContainer(this.topP2Container, p2Plates);

    // 渲染到正视图
    this.renderP2ToContainer(this.frontP2Container, p2Plates);
}
```

- [ ] **Step 2: 添加renderP2ToContainer()辅助方法**

在renderP2()方法之后插入以下代码：

```javascript
/**
 * 为单个容器渲染P2区域
 * @param {HTMLElement} container - 目标容器
 * @param {Array} p2Plates - P2碟子数组
 */
renderP2ToContainer(container, p2Plates) {
    if (!container) {
        return; // 容器不存在，跳过渲染
    }

    container.innerHTML = '';

    if (p2Plates.length === 0) {
        container.innerHTML = '<div style="color: #999; font-size: 12px; text-align: center; padding: 10px;"></div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    p2Plates.forEach((plate, index) => {
        const tag = this.createPlateTag(plate, index, 'p2');
        fragment.appendChild(tag);
    });
    container.appendChild(fragment);
}
```

- [ ] **Step 3: 在浏览器中测试P2显示**

1. 刷新页面
2. 在任一视图的P3输入框输入价格并确认多次（至少3次）
3. 检查俯视图的P1和P2区域是否都显示标签
4. 切换到正视图，检查P1和P2区域是否也显示相同的标签

预期：两个视图的P1和P2区域都显示相同的碟子标签。

- [ ] **Step 4: 提交更改**

```bash
git add js/custom-plate-module.js
git commit -m "feat: renderP2同时渲染到俯视图和正视图

- 添加renderP2ToContainer辅助方法
- renderP2调用两次renderP2ToContainer
- 确保两个视图的P2区域同步显示

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 修改clear()方法清空所有容器

**文件:**
- Modify: `js/custom-plate-module.js:416-420`

**目标:** 修改clear()方法，清空所有6个容器。

- [ ] **Step 1: 替换clear()方法的实现**

将当前的clear()方法（416-420行）替换为：

```javascript
/**
 * 清空所有显示（两个视图）
 */
clear() {
    // 清空俯视图
    if (this.topP1Container) this.topP1Container.innerHTML = '';
    if (this.topP2Container) this.topP2Container.innerHTML = '';
    if (this.topP3Container) this.topP3Container.innerHTML = '';

    // 清空正视图
    if (this.frontP1Container) this.frontP1Container.innerHTML = '';
    if (this.frontP2Container) this.frontP2Container.innerHTML = '';
    if (this.frontP3Container) this.frontP3Container.innerHTML = '';
}
```

- [ ] **Step 2: 在浏览器中测试清除功能**

1. 刷新页面
2. 添加几个自定义碟
3. 点击"清除"按钮，确认清除
4. 检查俯视图和正视图的P1/P2区域是否都清空

预期：两个视图的P1/P2/P3区域都清空。

- [ ] **Step 3: 提交更改**

```bash
git add js/custom-plate-module.js
git commit -m "fix: clear方法清空所有视图的容器

- 清空俯视图的P1/P2/P3容器
- 清空正视图的P1/P2/P3容器
- 添加容器存在性检查

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: 修改destroy()方法清理所有容器引用

**文件:**
- Modify: `js/custom-plate-module.js:424-441`

**目标:** 修改destroy()方法，清理所有6个容器的引用。

- [ ] **Step 1: 替换destroy()方法的实现**

将当前的destroy()方法（424-441行）替换为：

```javascript
/**
 * 销毁渲染器
 */
destroy() {
    this.clear();

    // 清理所有事件监听器
    this.boundElements.forEach(element => {
        // 由于我们无法移除匿名函数，直接克隆替换节点
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
    });
    this.boundElements = [];

    // 清空俯视图容器引用
    this.topP1Container = null;
    this.topP2Container = null;
    this.topP3Container = null;

    // 清空正视图容器引用
    this.frontP1Container = null;
    this.frontP2Container = null;
    this.frontP3Container = null;

    this.onAddCallback = null;
    this.onRemoveCallback = null;
}
```

- [ ] **Step 2: 在浏览器中测试（可选）**

destroy()方法通常在页面卸载或模块重建时调用，手动测试较难。

可以通过添加临时测试代码验证：
```javascript
// 在浏览器控制台执行
CustomPlateModule.destroy();
console.log('CustomPlateModule destroyed');
```

预期：无错误，容器引用被清空。

- [ ] **Step 3: 提交更改**

```bash
git add js/custom-plate-module.js
git commit -m "refactor: destroy方法清理所有容器引用

- 清空俯视图的3个容器引用
- 清空正视图的3个容器引用
- 确保完整清理资源

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: 修改app.js的showFrontView()方法

**文件:**
- Modify: `js/app.js:338-350`

**目标:** 移除showFrontView()中手动控制P1/P2/P3显示的代码。

- [ ] **Step 1: 修改showFrontView()方法**

将当前的showFrontView()方法（338-350行）替换为：

```javascript
// 显示正视图
function showFrontView() {
    state.currentView = 'front';
    elements.topView.style.display = 'none';
    elements.frontView.style.display = 'flex';
    elements.backBtn.style.display = 'block';
    elements.totalBtn.style.display = 'none';

    updateFrontView();
}
```

**注意：** 移除了 `document.querySelectorAll('.p1, .p2-p3-box').forEach(el => el.style.display = 'none');` 这一行。

- [ ] **Step 2: 在浏览器中测试视图切换**

1. 刷新页面
2. 添加几个自定义碟
3. 点击"总计"按钮切换到正视图
4. 检查正视图的P1/P2/P3区域是否显示

预期：正视图的P1/P2/P3区域正常显示，与俯视图内容同步。

- [ ] **Step 3: 提交更改**

```bash
git add js/app.js
git commit -m "refactor: showFrontView移除手动控制P1/P2/P3显示

- 移除document.querySelectorAll('.p1, .p2-p3-box')的显示控制
- 通过父容器的display属性自动控制子元素显示
- 简化视图切换逻辑

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: 修改app.js的showTopView()方法

**文件:**
- Modify: `js/app.js:352-364`

**目标:** 移除showTopView()中手动控制P1/P2/P3显示的代码。

- [ ] **Step 1: 修改showTopView()方法**

将当前的showTopView()方法（352-364行）替换为：

```javascript
// 显示俯视图
function showTopView() {
    state.currentView = 'top';
    elements.frontView.style.display = 'none';
    elements.topView.style.display = 'block';
    elements.backBtn.style.display = 'block';
    elements.totalBtn.style.display = 'block';

    updateTopView();
}
```

**注意：** 移除了 `document.querySelectorAll('.p1, .p2-p3-box').forEach(el => el.style.display = '');` 这一行。

- [ ] **Step 2: 在浏览器中测试视图切换**

1. 刷新页面
2. 切换到正视图
3. 点击"返回"按钮切换回俯视图
4. 检查俯视图的P1/P2/P3区域是否显示

预期：俯视图的P1/P2/P3区域正常显示。

- [ ] **Step 3: 提交更改**

```bash
git add js/app.js
git commit -m "refactor: showTopView移除手动控制P1/P2/P3显示

- 移除document.querySelectorAll('.p1, .p2-p3-box')的显示控制
- 通过父容器的display属性自动控制子元素显示
- 简化视图切换逻辑

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 11: 完整功能测试

**文件:**
- Test: 手动浏览器测试

**目标:** 执行完整的功能测试，确保所有功能正常工作。

- [ ] **Step 1: 测试添加功能 - 俯视图**

1. 刷新页面
2. 在俯视图的P3输入框输入价格：25
3. 点击"确认"按钮
4. 检查俯视图的P1或P2区域是否显示新标签（¥25）
5. 切换到正视图，检查P1或P2区域是否也显示相同标签

预期：两个视图都显示新添加的碟子。

- [ ] **Step 2: 测试添加功能 - 正视图**

1. 切换到正视图
2. 在正视图的P3输入框输入价格：30
3. 点击"确认"按钮
4. 检查正视图的P1或P2区域是否显示新标签（¥30）
5. 切换到俯视图，检查P1或P2区域是否也显示相同标签

预期：两个视图都显示新添加的碟子。

- [ ] **Step 3: 测试删除功能 - 俯视图**

1. 在俯视图长按一个碟子标签
2. 等待800ms，确认删除
3. 检查俯视图的碟子是否被删除
4. 切换到正视图，检查相同的碟子是否也被删除

预期：两个视图的碟子都被删除。

- [ ] **Step 4: 测试删除功能 - 正视图**

1. 在正视图长按一个碟子标签
2. 等待800ms，确认删除
3. 检查正视图的碟子是否被删除
4. 切换到俯视图，检查相同的碟子是否也被删除

预期：两个视图的碟子都被删除。

- [ ] **Step 5: 测试视图切换**

1. 添加多个碟子（至少5个）
2. 在俯视图和正视图之间多次切换
3. 每次切换后检查P1/P2/P3区域是否正确显示

预期：视图切换时，P1/P2/P3区域正确显示，数据一致。

- [ ] **Step 6: 测试总价计算**

1. 添加几个固定碟（白碟、红碟等）
2. 添加几个自定义碟
3. 切换到正视图，检查总价是否包含所有碟子
4. 删除一个自定义碟，检查总价是否正确更新

预期：总价计算正确，包含固定碟和自定义碟。

- [ ] **Step 7: 测试清除功能**

1. 添加多个碟子
2. 点击"清除"按钮，确认清除
3. 检查俯视图和正视图的P1/P2区域是否都清空
4. 检查总价是否重置为0

预期：所有数据被清除，两个视图都显示空状态。

- [ ] **Step 8: 测试输入验证**

1. 在任一视图的P3输入框输入：-10
2. 点击"确认"按钮
3. 检查是否显示错误提示："价格必须大于0"

预期：显示错误提示，不添加碟子。

- [ ] **Step 9: 测试空状态**

1. 清除所有碟子
2. 在俯视图和正视图之间切换
3. 检查是否不会报错

预期：无错误，空状态正常显示。

- [ ] **Step 10: 测试连续操作**

1. 快速连续添加多个碟子（在俯视图）
2. 立即切换到正视图
3. 在正视图快速连续添加多个碟子
4. 切换回俯视图
5. 检查数据是否一致

预期：数据在两个视图之间保持同步。

- [ ] **Step 11: 移动端响应式测试**

1. 打开浏览器开发者工具
2. 切换到移动设备模拟（例如iPhone 12）
3. 重复上述测试步骤

预期：移动端布局正常，功能正常。

- [ ] **Step 12: 提交测试完成**

```bash
git add .
git commit -m "test: 完成正视图自定义碟显示功能测试

- 测试添加功能（俯视图和正视图）
- 测试删除功能（俯视图和正视图）
- 测试视图切换
- 测试总价计算
- 测试清除功能
- 测试输入验证
- 测试空状态
- 测试连续操作
- 测试移动端响应式

所有测试通过，功能正常。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## 自我审查清单

### 1. 规范覆盖检查

- ✅ CustomPlateRenderer构造函数改造（Task 1）
- ✅ init()方法使用精确选择器（Task 2）
- ✅ renderP3()改造（Task 3, 4）
- ✅ renderP1()改造（Task 5）
- ✅ renderP2()改造（Task 6）
- ✅ clear()方法改造（Task 7）
- ✅ destroy()方法改造（Task 8）
- ✅ showFrontView()改造（Task 9）
- ✅ showTopView()改造（Task 10）
- ✅ 完整功能测试（Task 11）

### 2. 占位符扫描

- ✅ 没有TBD、TODO或"待实现"的标记
- ✅ 每个步骤都包含完整的代码
- ✅ 没有引用未定义的方法或属性

### 3. 类型一致性检查

- ✅ 容器属性名称一致（topP1Container, frontP1Container等）
- ✅ 方法名称一致（renderP1ToContainer, renderP2ToContainer等）
- ✅ 选择器一致（#topView .p1, #frontView .p1等）

### 4. 代码完整性检查

- ✅ 每个任务都包含完整的代码片段
- ✅ 每个任务都有明确的测试步骤
- ✅ 每个任务都有提交命令

---

## 实现总结

本计划通过10个代码修改任务和1个完整测试任务，实现了正视图自定义碟显示功能：

**核心改动：**
1. CustomPlateRenderer从3个容器引用扩展到6个（俯视图和正视图各3个）
2. 使用精确选择器（#topView .p1, #frontView .p1等）获取独立容器
3. 渲染方法（renderP1, renderP2, renderP3）同时操作两个视图的容器
4. 移除app.js中手动控制P1/P2/P3显示的代码，通过父容器自动控制

**关键设计决策：**
- 保持单一数据源（CustomPlateManager）
- 数据变更时同步渲染到两个视图
- 通过父容器的display属性控制视图显示/隐藏
- 容器不存在时跳过渲染，提供容错能力

**测试覆盖：**
- 添加功能（两个视图）
- 删除功能（两个视图）
- 视图切换
- 总价计算
- 清除功能
- 输入验证
- 空状态
- 连续操作
- 移动端响应式
