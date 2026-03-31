/**
 * CustomPlateManager - 管理自定义碟数据队列
 * 职责：添加、删除、查询自定义碟，计算总价
 */
class CustomPlateManager {
    constructor() {
        // 双队列系统
        this.p1Queue = [];  // P1区域的碟子队列
        this.p2Queue = [];  // P2区域的碟子队列
        this.nextPlateId = 0;  // 全局ID计数器
    }

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

        // 选择目标队列（在递增ID之前，这样selectTargetQueue可以使用当前ID判断）
        const targetQueue = this.selectTargetQueue();

        // 创建碟子对象
        const plate = {
            id: this.nextPlateId++,
            price: price,
            createTime: Date.now()
        };

        // 添加到选定的队列
        targetQueue.push(plate);

        return plate;
    }

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

    /**
     * 获取所有自定义碟
     * @returns {Array} 自定义碟队列的副本
     */
    getAll() {
        return [...this.p1Queue, ...this.p2Queue];
    }

    /**
     * 获取P1队列的碟子
     * @returns {Array} P1队列的副本
     */
    getP1Plates() {
        return [...this.p1Queue];
    }

    /**
     * 获取P2队列的碟子
     * @returns {Array} P2队列的副本
     */
    getP2Plates() {
        return [...this.p2Queue];
    }

    /**
     * 计算自定义碟总价
     * @returns {number} 总价
     */
    calculateTotal() {
        return [...this.p1Queue, ...this.p2Queue].reduce((sum, plate) => sum + plate.price, 0);
    }

    /**
     * 清空所有自定义碟
     */
    clear() {
        this.p1Queue = [];
        this.p2Queue = [];
        this.nextPlateId = 0;
    }

    /**
     * 验证价格输入
     * @param {number} price - 待验证的价格
     * @returns {Object} { valid: boolean, message: string }
     */
    validatePrice(price) {
        // 必须是数字
        if (typeof price !== 'number' || isNaN(price)) {
            return { valid: false, message: '请输入数字' };
        }

        // 必须为正数
        if (price <= 0) {
            return { valid: false, message: '价格必须大于0' };
        }

        return { valid: true };
    }

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

    /**
     * 获取队列长度
     * @returns {number} 队列长度
     */
    getLength() {
        return this.p1Queue.length + this.p2Queue.length;
    }
}

/**
 * CustomPlateRenderer - 负责P1/P2/P3的DOM渲染
 * 职责：渲染自定义碟标签、输入区域，处理长按删除
 */
class CustomPlateRenderer {
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
        `;
        this.bindLongPress(tag, index, queueType);
        return tag;
    }

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

    /**
     * 渲染P3输入区域（两个视图）
     */
    renderP3() {
        // 渲染俯视图P3
        this.renderP3Input(this.topP3Container, '俯视图');

        // 渲染正视图P3
        this.renderP3Input(this.frontP3Container, '正视图');
    }

    /**
     * 处理添加碟子
     * @param {HTMLInputElement} input - 输入框元素
     * @param {HTMLElement} errorDiv - 错误提示元素
     */
    handleAddPlate(input, errorDiv) {
        const priceStr = input.value.trim();
        const price = parseFloat(priceStr);

        // 清空之前的错误提示
        errorDiv.textContent = '';

        // 验证价格
        const validation = this.manager.validatePrice(price);
        if (!validation.valid) {
            errorDiv.textContent = validation.message;
            return;
        }

        // 添加碟子
        const plate = this.manager.add(price);
        if (!plate) {
            errorDiv.textContent = '添加失败，请重试';
            return;
        }

        // 清空输入框
        input.value = '';

        // 重新渲染P1和P2
        this.renderP1();
        this.renderP2();

        // 触发回调
        if (this.onAddCallback) {
            this.onAddCallback(plate);
        }
    }

    /**
     * 绑定长按删除事件
     * @param {HTMLElement} element - 要绑定的元素
     * @param {number} index - 碟子索引
     * @param {string} queueType - 队列类型 ('p1' 或 'p2')
     */
    bindLongPress(element, index, queueType) {
        const startPress = () => {
            this.pressTimer = setTimeout(() => {
                // 长按触发，添加视觉反馈
                element.style.transform = 'scale(0.95)';
                element.style.opacity = '0.8';

                // 清理 timer
                this.pressTimer = null;

                // 确认删除
                if (confirm('确定要删除这个碟子吗？')) {
                    this.handleRemovePlate(index, queueType);
                }

                // 恢复样式
                setTimeout(() => {
                    element.style.transform = '';
                    element.style.opacity = '';
                }, 200);
            }, this.LONG_PRESS_THRESHOLD);
        };

        const endPress = () => {
            if (this.pressTimer) {
                clearTimeout(this.pressTimer);
                this.pressTimer = null;
            }
        };

        // 鼠标事件
        element.addEventListener('mousedown', startPress);
        element.addEventListener('mouseup', endPress);
        element.addEventListener('mouseleave', endPress);

        // 触摸事件
        element.addEventListener('touchstart', startPress);
        element.addEventListener('touchend', endPress);
        element.addEventListener('touchcancel', endPress);

        // 追踪绑定的元素
        this.boundElements.push(element);
    }

    /**
     * 处理删除碟子
     * @param {number} index - 碟子索引
     * @param {string} queueType - 队列类型 ('p1' 或 'p2')
     */
    handleRemovePlate(index, queueType) {
        const success = this.manager.remove(queueType, index);
        if (success) {
            this.renderP1();
            this.renderP2();
            if (this.onRemoveCallback) {
                this.onRemoveCallback(index, queueType);
            }
        }
    }

    /**
     * 渲染所有区域
     */
    renderAll() {
        this.renderP1();
        this.renderP2();
        // P3不需要重新渲染
    }

    /**
     * 设置添加碟子的回调函数
     * @param {Function} callback - 回调函数
     */
    onAdd(callback) {
        this.onAddCallback = callback;
    }

    /**
     * 设置删除碟子的回调函数
     * @param {Function} callback - 回调函数
     */
    onRemove(callback) {
        this.onRemoveCallback = callback;
    }

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

        this.p1Container = null;
        this.p2Container = null;
        this.p3Container = null;
        this.onAddCallback = null;
        this.onRemoveCallback = null;
    }
}

/**
 * CustomPlateModule - 自定义碟主模块
 * 职责：整合Manager、Renderer、Events，提供统一接口
 */
const CustomPlateModule = (function() {
    let manager = null;
    let renderer = null;
    let initialized = false;

    /**
     * 初始化模块
     */
    function init() {
        if (initialized) {
            console.warn('CustomPlateModule: 已经初始化');
            return;
        }

        manager = new CustomPlateManager();
        renderer = new CustomPlateRenderer(manager);

        renderer.init();

        // 设置事件回调
        renderer.onAdd((plate) => {
            // 触发添加事件
            document.dispatchEvent(new CustomEvent('customPlate:added', {
                detail: { plate: plate }
            }));
        });

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

        initialized = true;
        console.log('CustomPlateModule: 初始化完成');
    }

    /**
     * 添加自定义碟
     * @param {number} price - 碟子价格
     * @returns {boolean} 成功返回true，失败返回false
     */
    function addCustomPlate(price) {
        if (!initialized) {
            console.error('CustomPlateModule: 未初始化');
            return false;
        }

        const plate = manager.add(price);
        if (plate) {
            renderer.renderAll();
            return true;
        }
        return false;
    }

    /**
     * 删除自定义碟
     * @param {string} queueType - 队列类型 ('p1' 或 'p2')
     * @param {number} index - 碟子索引
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

    /**
     * 获取所有自定义碟
     * @returns {Array} 自定义碟数组
     */
    function getCustomPlates() {
        if (!initialized) {
            console.error('CustomPlateModule: 未初始化');
            return [];
        }
        return manager.getAll();
    }

    /**
     * 计算自定义碟总价
     * @returns {number} 总价
     */
    function calculateTotal() {
        if (!initialized) {
            console.error('CustomPlateModule: 未初始化');
            return 0;
        }
        return manager.calculateTotal();
    }

    /**
     * 更新显示
     */
    function render() {
        if (!initialized) {
            console.error('CustomPlateModule: 未初始化');
            return;
        }
        renderer.renderAll();
    }

    /**
     * 清空所有自定义碟
     */
    function clear() {
        if (!initialized) {
            console.error('CustomPlateModule: 未初始化');
            return;
        }
        manager.clear();
        renderer.clear();
    }

    /**
     * 销毁模块
     */
    function destroy() {
        if (renderer) {
            renderer.destroy();
        }
        manager = null;
        renderer = null;
        initialized = false;
        console.log('CustomPlateModule: 已销毁');
    }

    // 公开API
    return {
        init,
        addCustomPlate,
        removeCustomPlate,
        getCustomPlates,
        calculateTotal,
        render,
        clear,
        destroy
    };
})();