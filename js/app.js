// 碟子配置
const PLATE_CONFIG = {
    white: { price: 8, class: 'plate-white' },
    red: { price: 10, class: 'plate-red' },
    silver: { price: 15, class: 'plate-silver' },
    gold: { price: 20, class: 'plate-gold' },
    black: { price: 28, class: 'plate-black' }
};

// 状态管理
const state = {
    quantities: {
        white: 0,
        red: 0,
        silver: 0,
        gold: 0,
        black: 0
    },
    // 记录点击顺序，用于堆叠显示
    plateOrder: [],
    currentView: 'top' // 'top' 或 'front'
};

// DOM 元素
const elements = {};

// 初始化
function init() {
    // 获取所有 DOM 元素
    elements.plateControls = document.querySelectorAll('.plate-control');
    elements.platesContainer = document.getElementById('platesContainer');
    elements.stackContainer = document.getElementById('stackContainer');
    elements.totalDisplay = document.getElementById('totalDisplay');
    elements.topView = document.getElementById('topView');
    elements.frontView = document.getElementById('frontView');
    elements.backBtn = document.getElementById('backBtn');
    elements.totalBtn = document.getElementById('totalBtn');
    elements.clearBtn = document.getElementById('clearBtn');

    // 绑定事件
    bindEvents();

    // 初始化显示
    updateDisplay();
}

// 绑定事件
function bindEvents() {
    // 为每个碟子控制绑定事件
    elements.plateControls.forEach(control => {
        const color = control.dataset.color;
        const plateBtn = control.querySelector('.plate-btn');
        const minusBtn = control.querySelector('.minus-btn');

        // 点击碟子增加数量
        plateBtn.addEventListener('click', () => addPlate(color));

        // 点击减号减少数量
        minusBtn.addEventListener('click', () => removePlate(color));
    });

    // 总计按钮
    elements.totalBtn.addEventListener('click', showFrontView);

    // 返回按钮
    elements.backBtn.addEventListener('click', showTopView);

    // 清除按钮
    elements.clearBtn.addEventListener('click', clearData);
}

// 添加碟子
function addPlate(color) {
    state.quantities[color]++;
    state.plateOrder.push(color);
    updateDisplay();
}

// 移除碟子
function removePlate(color) {
    if (state.quantities[color] > 0) {
        state.quantities[color]--;

        // 从顺序中移除最后一个该颜色的碟子
        const lastIndex = state.plateOrder.lastIndexOf(color);
        if (lastIndex !== -1) {
            state.plateOrder.splice(lastIndex, 1);
        }

        updateDisplay();
    }
}

// 更新显示
function updateDisplay() {
    // 更新数量显示
    updateQuantityDisplay();

    // 根据当前视图更新显示
    if (state.currentView === 'top') {
        updateTopView();
    } else {
        updateFrontView();
    }
}

// 更新数量显示
function updateQuantityDisplay() {
    elements.plateControls.forEach(control => {
        const color = control.dataset.color;
        const quantitySpan = control.querySelector('.quantity');
        const minusBtn = control.querySelector('.minus-btn');

        quantitySpan.textContent = state.quantities[color];
        minusBtn.disabled = state.quantities[color] === 0;
    });
}

// 更新俯视图
function updateTopView() {
    elements.platesContainer.innerHTML = '';

    // 只显示最新点击的碟子
    if (state.plateOrder.length > 0) {
        const lastColor = state.plateOrder[state.plateOrder.length - 1];
        const plate = document.createElement('div');
        plate.className = `plate-item ${PLATE_CONFIG[lastColor].class}`;
        elements.platesContainer.appendChild(plate);
    }
}

// 更新正视图
function updateFrontView() {
    const currentChildren = Array.from(elements.stackContainer.children);
    const targetOrder = state.plateOrder;

    // 智能判断是否需要重建
    const needsRebuild = checkIfNeedsRebuild(currentChildren, targetOrder);

    if (needsRebuild) {
        rebuildStack(targetOrder);
    }

    // 更新总价
    updateTotalDisplay();
}

// 检查是否需要重建堆叠
function checkIfNeedsRebuild(currentChildren, targetOrder) {
    // 数量不同，需要重建
    if (currentChildren.length !== targetOrder.length) {
        return true;
    }

    // 数量相同，检查每个位置的颜色是否匹配
    for (let i = 0; i < targetOrder.length; i++) {
        const expectedColor = targetOrder[i];
        const colorClass = `plate-${expectedColor}`;
        if (!currentChildren[i].classList.contains(colorClass)) {
            return true;
        }
    }

    // 完全匹配，不需要重建
    return false;
}

// 重建堆叠视图
function rebuildStack(plateOrder) {
    elements.stackContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();

    plateOrder.forEach((color) => {
        const plate = document.createElement('div');
        plate.className = `stack-plate ${PLATE_CONFIG[color].class}`;
        plate.style.marginBottom = `${(-10)}px`;
        plate.style.animation = 'none'; // 禁用动画避免闪烁
        fragment.appendChild(plate);
    });

    elements.stackContainer.appendChild(fragment);
}

// 更新总价显示
function updateTotalDisplay() {
    const total = calculateTotal();
    elements.totalDisplay.innerHTML = `
        <span class="label">总价:</span>
        <span class="amount">¥${total}</span>
    `;
}

// 计算总价
function calculateTotal() {
    let total = 0;
    for (const color in state.quantities) {
        total += state.quantities[color] * PLATE_CONFIG[color].price;
    }
    return total;
}

// 显示正视图
function showFrontView() {
    if (state.plateOrder.length === 0) {
        alert('请先添加碟子！');
        return;
    }

    state.currentView = 'front';
    elements.topView.style.display = 'none';
    elements.frontView.style.display = 'flex';
    elements.backBtn.style.display = 'block';
    elements.totalBtn.style.display = 'none';

    updateFrontView();
}

// 显示俯视图
function showTopView() {
    state.currentView = 'top';
    elements.frontView.style.display = 'none';
    elements.topView.style.display = 'block';
    elements.backBtn.style.display = 'block';
    elements.totalBtn.style.display = 'block';

    updateTopView();
}

// 清除数据
function clearData() {
    if (state.plateOrder.length === 0) {
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

    // 如果在正视图，先返回俯视图
    if (state.currentView === 'front') {
        showTopView();
    }

    // 更新所有显示（包括数量）
    updateDisplay();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
