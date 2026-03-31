# 正视图自定义碟显示功能设计文档

**日期:** 2026-04-01
**作者:** Claude Sonnet 4.6
**状态:** 设计阶段

## 1. 概述

### 1.1 背景

当前应用已经实现了俯视图的自定义碟显示功能（P1/P2/P3区域），但正视图的自定义碟显示逻辑尚未实现。正视图的P1/P2/P3 DOM元素已经创建并定位好，需要补充渲染和交互逻辑。

### 1.2 目标

使正视图的P1/P2/P3区域具备与俯视图完全相同的功能：
- P1/P2区域显示自定义碟标签
- P3区域提供价格输入和添加功能
- 两个视图的数据保持实时同步
- 视图切换时正确显示/隐藏对应区域

### 1.3 设计原则

- **单一数据源**: CustomPlateManager作为唯一数据源
- **视图同步**: 数据变更时同时渲染到两个视图
- **代码复用**: 复用现有的CustomPlateModule架构
- **向后兼容**: 不破坏现有功能

## 2. 架构设计

### 2.1 核心改动

修改 `CustomPlateRenderer` 类，使其支持同时渲染到两个视图：

**当前状态:**
```javascript
// 使用通用选择器，只能获取第一个匹配元素
this.p1Container = document.querySelector('.p1');
this.p2Container = document.querySelector('.p2');
this.p3Container = document.querySelector('.p3');
```

**改造后:**
```javascript
// 使用精确选择器，获取两套独立容器
// 俯视图容器
this.topP1Container = document.querySelector('#topView .p1');
this.topP2Container = document.querySelector('#topView .p2');
this.topP3Container = document.querySelector('#topView .p3');

// 正视图容器
this.frontP1Container = document.querySelector('#frontView .p1');
this.frontP2Container = document.querySelector('#frontView .p2');
this.frontP3Container = document.querySelector('#frontView .p3');
```

### 2.2 不变的部分

- `CustomPlateManager`: 数据管理逻辑保持不变
- `CustomPlateModule`: 公开API保持不变
- `app.js` 的状态管理: 保持不变
- CSS样式: 保持不变

## 3. 详细设计

### 3.1 CustomPlateRenderer 改造

#### 3.1.1 构造函数和初始化

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
    // 其他属性...
}

init() {
    // 获取俯视图容器
    this.topP1Container = document.querySelector('#topView .p1');
    this.topP2Container = document.querySelector('#topView .p2');
    this.topP3Container = document.querySelector('#topView .p3');

    // 获取正视图容器
    this.frontP1Container = document.querySelector('#frontView .p1');
    this.frontP2Container = document.querySelector('#frontView .p2');
    this.frontP3Container = document.querySelector('#frontView .p3');

    // 验证容器存在
    if (!this.topP1Container || !this.topP2Container || !this.topP3Container) {
        console.error('CustomPlateRenderer: 找不到俯视图P1/P2/P3容器');
    }
    if (!this.frontP1Container || !this.frontP2Container || !this.frontP3Container) {
        console.error('CustomPlateRenderer: 找不到正视图P1/P2/P3容器');
    }

    // 渲染P3输入区域（两个视图）
    this.renderP3();

    // 初始渲染P1和P2（两个视图）
    this.renderP1();
    this.renderP2();
}
```

#### 3.1.2 renderP1() 改造

```javascript
renderP1() {
    const p1Plates = this.manager.getP1Plates();

    // 渲染到俯视图
    if (this.topP1Container) {
        this.topP1Container.innerHTML = '';
        if (p1Plates.length === 0) {
            this.topP1Container.innerHTML = '<div style="color: #999; font-size: 12px; text-align: center; padding: 10px;"></div>';
        } else {
            const fragment = document.createDocumentFragment();
            p1Plates.forEach((plate, index) => {
                const tag = this.createPlateTag(plate, index, 'p1');
                fragment.appendChild(tag);
            });
            this.topP1Container.appendChild(fragment);
        }
    }

    // 渲染到正视图
    if (this.frontP1Container) {
        this.frontP1Container.innerHTML = '';
        if (p1Plates.length === 0) {
            this.frontP1Container.innerHTML = '<div style="color: #999; font-size: 12px; text-align: center; padding: 10px;"></div>';
        } else {
            const fragment = document.createDocumentFragment();
            p1Plates.forEach((plate, index) => {
                const tag = this.createPlateTag(plate, index, 'p1');
                fragment.appendChild(tag);
            });
            this.frontP1Container.appendChild(fragment);
        }
    }
}
```

#### 3.1.3 renderP2() 改造

与 `renderP1()` 类似，同时渲染到 `topP2Container` 和 `frontP2Container`。

#### 3.1.4 renderP3() 改造

```javascript
renderP3() {
    // 渲染俯视图P3
    if (this.topP3Container) {
        this.renderP3Input(this.topP3Container);
    }

    // 渲染正视图P3
    if (this.frontP3Container) {
        this.renderP3Input(this.frontP3Container);
    }
}

renderP3Input(container) {
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

    const input = container.querySelector('.p3-input');
    const confirmBtn = container.querySelector('.p3-confirm-btn');
    const errorDiv = container.querySelector('.p3-error');

    if (!input || !confirmBtn || !errorDiv) {
        console.error('CustomPlateRenderer: P3区域元素不完整');
        return;
    }

    confirmBtn.addEventListener('click', () => {
        this.handleAddPlate(input, errorDiv);
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            this.handleAddPlate(input, errorDiv);
        }
    });
}
```

#### 3.1.5 其他方法调整

- `clear()`: 清空所有6个容器
- `destroy()`: 清理所有6个容器的引用

### 3.2 app.js 视图切换逻辑修改

#### 3.2.1 当前问题

```javascript
// showFrontView() - 会隐藏所有P1/P2/P3区域
document.querySelectorAll('.p1, .p2-p3-box').forEach(el => el.style.display = 'none');

// showTopView() - 会显示所有P1/P2/P3区域
document.querySelectorAll('.p1, .p2-p3-box').forEach(el => el.style.display = '');
```

这种方式会导致正视图切换时，P1/P2/P3区域被隐藏。

#### 3.2.2 改造方案

**移除手动控制P1/P2/P3显示的代码**

```javascript
// showFrontView() - 简化版
function showFrontView() {
    state.currentView = 'front';
    elements.topView.style.display = 'none';
    elements.frontView.style.display = 'flex';
    elements.backBtn.style.display = 'block';
    elements.totalBtn.style.display = 'none';

    // 移除: document.querySelectorAll('.p1, .p2-p3-box').forEach(...)

    updateFrontView();
}

// showTopView() - 简化版
function showTopView() {
    state.currentView = 'top';
    elements.frontView.style.display = 'none';
    elements.topView.style.display = 'block';
    elements.backBtn.style.display = 'block';
    elements.totalBtn.style.display = 'block';

    // 移除: document.querySelectorAll('.p1, .p2-p3-box').forEach(...)

    updateTopView();
}
```

**原理:** 通过父容器（`#topView` 和 `#frontView`）的 `display` 属性控制，子元素（P1/P2/P3）会自动显示/隐藏。

### 3.3 数据流设计

#### 3.3.1 添加自定义碟流程

```
用户在任一视图的P3输入框输入价格
  ↓
点击确认按钮
  ↓
CustomPlateRenderer.handleAddPlate()
  - 验证价格
  - 调用 CustomPlateManager.add()
  ↓
CustomPlateManager.add()
  - 选择目标队列（P1或P2）
  - 创建碟子对象
  - 添加到队列
  ↓
CustomPlateRenderer.renderP1()
  - 清空 topP1Container
  - 清空 frontP1Container
  - 渲染P1碟子到两个视图
  ↓
CustomPlateRenderer.renderP2()
  - 清空 topP2Container
  - 清空 frontP2Container
  - 渲染P2碟子到两个视图
  ↓
触发 customPlate:added 事件
  ↓
app.js 监听事件
  - 调用 updateTotalDisplay()
```

#### 3.3.2 删除自定义碟流程

```
用户在任一视图长按碟子标签
  ↓
800ms后触发长按事件
  ↓
弹出确认对话框
  ↓
用户确认删除
  ↓
CustomPlateRenderer.handleRemovePlate()
  - 调用 CustomPlateManager.remove()
  ↓
CustomPlateManager.remove()
  - 从指定队列删除碟子
  ↓
CustomPlateRenderer.renderP1()
  - 重新渲染两个视图的P1
  ↓
CustomPlateRenderer.renderP2()
  - 重新渲染两个视图的P2
  ↓
触发 customPlate:removed 事件
  ↓
app.js 监听事件
  - 调用 updateTotalDisplay()
```

#### 3.3.3 视图切换流程

```
用户点击"总计"按钮
  ↓
app.js.showFrontView()
  - 隐藏 #topView (display: none)
  - 显示 #frontView (display: flex)
  ↓
正视图的P1/P2/P3自动显示
  （因为 #frontView 已显示，且内容已预先渲染）
```

### 3.4 边缘情况处理

#### 3.4.1 初始化时的容器检查

```javascript
init() {
    // 获取容器
    this.topP1Container = document.querySelector('#topView .p1');
    // ...

    // 容错处理：允许部分容器缺失
    if (!this.topP1Container) {
        console.warn('CustomPlateRenderer: 俯视图P1容器不存在');
    }
    if (!this.frontP1Container) {
        console.warn('CustomPlateRenderer: 正视图P1容器不存在');
    }

    // 至少需要一个视图的容器完整才能继续
    if (!this.topP1Container && !this.frontP1Container) {
        console.error('CustomPlateRenderer: 没有可用的P1容器');
        return;
    }

    // 继续初始化...
}
```

#### 3.4.2 空状态处理

- 当P1队列为空时，两个视图的P1容器都显示空状态
- 当P2队列为空时，两个视图的P2容器都显示空状态
- 空状态可以显示空白或占位符（根据需求）

#### 3.4.3 输入验证

- 两个视图的P3输入框都执行相同的价格验证
- 验证失败时，只在当前输入框下方显示错误信息
- 验证规则保持不变（正数、数字类型）

### 3.5 性能考虑

#### 3.5.1 渲染性能

- 使用 `DocumentFragment` 批量插入DOM元素
- 避免频繁的DOM重排
- 两个视图的渲染是同步的，但不会显著影响性能（标签数量有限）

#### 3.5.2 事件监听器

- 长按事件绑定到每个标签元素
- 输入框事件绑定在初始化时完成
- 不需要动态添加/删除事件监听器

### 3.6 向后兼容性

- `CustomPlateModule` 的公开API保持不变
- 不影响现有的俯视图功能
- 如果正视图容器不存在，俯视图仍能正常工作

## 4. 测试策略

### 4.1 功能测试

#### 4.1.1 添加功能测试
- [ ] 在俯视图P3输入价格，点击确认，验证两个视图的P1/P2都显示新碟子
- [ ] 在正视图P3输入价格，点击确认，验证两个视图的P1/P2都显示新碟子
- [ ] 输入无效价格（负数、0、非数字），验证错误提示显示

#### 4.1.2 删除功能测试
- [ ] 在俯视图长按碟子标签，确认删除，验证两个视图都移除该碟子
- [ ] 在正视图长按碟子标签，确认删除，验证两个视图都移除该碟子
- [ ] 取消删除，验证碟子不被移除

#### 4.1.3 视图切换测试
- [ ] 在俯视图添加碟子，切换到正视图，验证碟子正确显示
- [ ] 在正视图添加碟子，切换到俯视图，验证碟子正确显示
- [ ] 切换视图时，验证P3输入框在两个视图都可用

#### 4.1.4 总价计算测试
- [ ] 添加自定义碟，验证总价包含自定义碟价格
- [ ] 删除自定义碟，验证总价正确更新
- [ ] 切换视图时，验证总价显示正确

### 4.2 边缘测试

#### 4.2.1 空状态测试
- [ ] 无自定义碟时，切换视图，验证不会报错
- [ ] 无自定义碟时，两个视图的P1/P2都显示空状态

#### 4.2.2 连续操作测试
- [ ] 快速连续添加多个碟子，验证两个视图同步显示
- [ ] 在不同视图中交替添加碟子，验证数据一致性

#### 4.2.3 清除功能测试
- [ ] 有自定义碟时点击清除，验证两个视图的P1/P2都被清空
- [ ] 清除后添加新碟子，验证从ID 0开始

### 4.3 兼容性测试

#### 4.3.1 响应式测试
- [ ] 移动端（≤768px）验证布局正常
- [ ] 超小屏幕（≤375px）验证布局正常
- [ ] 桌面端验证布局正常

#### 4.3.2 浏览器测试
- [ ] Chrome最新版
- [ ] Safari最新版
- [ ] Firefox最新版
- [ ] Edge最新版

## 5. 实现清单

### 5.1 CustomPlateRenderer 改造

- [ ] 修改 `constructor()` 添加6个容器引用
- [ ] 修改 `init()` 使用精确选择器获取容器
- [ ] 修改 `renderP1()` 同时渲染到两个视图
- [ ] 修改 `renderP2()` 同时渲染到两个视图
- [ ] 修改 `renderP3()` 为两个视图创建输入框
- [ ] 添加 `renderP3Input()` 辅助方法
- [ ] 修改 `clear()` 清空所有6个容器
- [ ] 修改 `destroy()` 清理所有6个容器的引用

### 5.2 app.js 视图切换修改

- [ ] 修改 `showFrontView()` 移除手动控制P1/P2/P3显示的代码
- [ ] 修改 `showTopView()` 移除手动控制P1/P2/P3显示的代码

### 5.3 测试

- [ ] 执行功能测试清单
- [ ] 执行边缘测试清单
- [ ] 执行兼容性测试清单

### 5.4 文档

- [ ] 更新README（如需要）
- [ ] 添加代码注释

## 6. 风险和限制

### 6.1 风险

1. **性能风险**: 两个视图同时渲染可能在大批量碟子时影响性能
   - 缓解措施: 碟子数量有限（通常<50个），影响可控

2. **选择器依赖**: 依赖 `#topView` 和 `#frontView` ID
   - 缓解措施: HTML结构已固定，风险低

3. **事件监听器数量**: 每个碟子标签都有长按事件，两个视图会翻倍
   - 缓解措施: 碟子数量有限，内存影响可忽略

### 6.2 限制

1. 正视图和俯视图必须共享同一个 `CustomPlateManager` 实例
2. 两个视图的P1/P2/P3区域必须使用相同的class名
3. 不支持视图级别的独立数据（两个视图必须显示相同数据）

## 7. 后续优化建议

1. **虚拟滚动**: 如果碟子数量很大（>100个），考虑实现虚拟滚动
2. **动画优化**: 添加视图切换动画，提升用户体验
3. **数据持久化**: 考虑将自定义碟数据保存到localStorage
4. **单元测试**: 为CustomPlateRenderer添加单元测试

## 8. 总结

本设计通过修改 `CustomPlateRenderer` 的选择器逻辑，实现了正视图和俯视图的自定义碟同步显示。核心思路是：

1. 使用精确选择器获取两套独立的容器引用
2. 数据变更时同时渲染到两个视图
3. 通过父容器的display属性控制视图显示/隐藏
4. 保持单一数据源原则，确保数据一致性

该方案改动最小、性能最好、代码最简洁，符合现有架构设计原则。
