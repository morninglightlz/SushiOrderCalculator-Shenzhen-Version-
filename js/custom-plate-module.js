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

    /**
     * 从队列删除指定索引的碟子
     * @param {number} index - 碟子索引
     * @returns {boolean} 删除成功返回true，失败返回false
     */
    remove(index) {
        if (index < 0 || index >= this.customPlates.length) {
            return false;
        }
        this.customPlates.splice(index, 1);
        return true;
    }

    /**
     * 获取所有自定义碟
     * @returns {Array} 自定义碟队列的副本
     */
    getAll() {
        return [...this.customPlates];
    }

    /**
     * 根据索引获取碟子
     * @param {number} index - 碟子索引
     * @returns {Object|null} 碟子对象，不存在返回null
     */
    getByIndex(index) {
        if (index < 0 || index >= this.customPlates.length) {
            return null;
        }
        return this.customPlates[index];
    }

    /**
     * 获取偶数索引的碟子（用于P1显示）
     * @returns {Array} 偶数索引的碟子数组
     */
    getP1Plates() {
        return this.customPlates.filter((_, index) => index % 2 === 0);
    }

    /**
     * 获取奇数索引的碟子（用于P2显示）
     * @returns {Array} 奇数索引的碟子数组
     */
    getP2Plates() {
        return this.customPlates.filter((_, index) => index % 2 === 1);
    }

    /**
     * 计算自定义碟总价
     * @returns {number} 总价
     */
    calculateTotal() {
        return this.customPlates.reduce((sum, plate) => sum + plate.price, 0);
    }

    /**
     * 清空所有自定义碟
     */
    clear() {
        this.customPlates = [];
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
        return this.customPlates.length;
    }
}

/**
 * CustomPlateRenderer - 负责P1/P2/P3的DOM渲染
 * 职责：渲染自定义碟标签、输入区域，处理长按删除
 */
class CustomPlateRenderer {
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

    /**
     * 初始化渲染器，获取DOM元素引用
     */
    init() {
        this.p1Container = document.querySelector('.p1');
        this.p2Container = document.querySelector('.p2');
        this.p3Container = document.querySelector('.p3');

        if (!this.p1Container || !this.p2Container || !this.p3Container) {
            console.error('CustomPlateRenderer: 找不到P1/P2/P3容器');
            return;
        }

        // 渲染P3输入区域
        this.renderP3();

        // 初始渲染P1和P2
        this.renderP1();
        this.renderP2();
    }

    /**
     * 渲染P1区域（偶数索引的自定义碟）
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

        p1Plates.forEach((plate, displayIndex) => {
            // 计算在原队列中的实际索引
            const actualIndex = displayIndex * 2;
            const tag = this.createPlateTag(plate, actualIndex);
            fragment.appendChild(tag);
        });

        this.p1Container.appendChild(fragment);
    }

    /**
     * 渲染P2区域（奇数索引的自定义碟）
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

        p2Plates.forEach((plate, displayIndex) => {
            // 计算在原队列中的实际索引
            const actualIndex = displayIndex * 2 + 1;
            const tag = this.createPlateTag(plate, actualIndex);
            fragment.appendChild(tag);
        });

        this.p2Container.appendChild(fragment);
    }

    /**
     * 创建自定义碟标签元素
     * @param {Object} plate - 碟子对象
     * @param {number} index - 在队列中的索引
     * @returns {HTMLElement} 碟子标签元素
     */
    createPlateTag(plate, index) {
        const tag = document.createElement('div');
        tag.className = 'custom-plate-tag';
        tag.dataset.index = index;
        tag.innerHTML = `
            <span class="price">¥${plate.price}</span>
            <span class="hint">长按删除</span>
        `;

        // 绑定长按删除事件
        this.bindLongPress(tag, index);

        return tag;
    }

    /**
     * 渲染P3输入区域
     */
    renderP3() {
        if (!this.p3Container) return;

        this.p3Container.innerHTML = `
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
        const input = this.p3Container.querySelector('.p3-input');
        const confirmBtn = this.p3Container.querySelector('.p3-confirm-btn');
        const errorDiv = this.p3Container.querySelector('.p3-error');

        // 安全检查
        if (!input || !confirmBtn || !errorDiv) {
            console.error('CustomPlateRenderer: P3区域元素不完整');
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
     */
    bindLongPress(element, index) {
        const startPress = () => {
            this.pressTimer = setTimeout(() => {
                // 长按触发，添加视觉反馈
                element.style.transform = 'scale(0.95)';
                element.style.opacity = '0.8';

                // 清理 timer
                this.pressTimer = null;

                // 确认删除
                if (confirm('确定要删除这个碟子吗？')) {
                    this.handleRemovePlate(index);
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
     */
    handleRemovePlate(index) {
        const success = this.manager.remove(index);
        if (success) {
            // 重新渲染P1和P2
            this.renderP1();
            this.renderP2();

            // 触发回调
            if (this.onRemoveCallback) {
                this.onRemoveCallback(index);
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
     * 清空所有显示
     */
    clear() {
        if (this.p1Container) this.p1Container.innerHTML = '';
        if (this.p2Container) this.p2Container.innerHTML = '';
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

        renderer.onRemove((index) => {
            // 触发删除事件
            document.dispatchEvent(new CustomEvent('customPlate:removed', {
                detail: {
                    index: index,
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
     * @param {number} index - 碟子索引
     * @returns {boolean} 成功返回true，失败返回false
     */
    function removeCustomPlate(index) {
        if (!initialized) {
            console.error('CustomPlateModule: 未初始化');
            return false;
        }

        const success = manager.remove(index);
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