// 基础计算器变量
let currentInput = '';
let currentOperator = '';
let previousInput = '';
let bracketCount = 0;
let cursorPosition = 0;

// 基础计算器函数
function appendNumber(num) {
    const input = document.getElementById('basicInput');
    const pos = input.selectionStart;
    const value = input.value;
    input.value = value.slice(0, pos) + num + value.slice(pos);
    input.setSelectionRange(pos + 1, pos + 1);
    input.focus();
}

function appendOperator(operator) {
    const input = document.getElementById('basicInput');
    const pos = input.selectionStart;
    const value = input.value;
    
    // 处理括号计数
    if (operator === '(') bracketCount++;
    else if (operator === ')' && bracketCount > 0) bracketCount--;
    
    // 处理开方符号
    if (operator === '√') {
        input.value = value.slice(0, pos) + 'sqrt(' + value.slice(pos);
        input.setSelectionRange(pos + 5, pos + 5);
        bracketCount++;
    } else {
        input.value = value.slice(0, pos) + operator + value.slice(pos);
        input.setSelectionRange(pos + 1, pos + 1);
    }
    input.focus();
}

function updateDisplay() {
    const input = document.getElementById('basicInput');
    input.focus();
}

function clearBasicCalc() {
    const input = document.getElementById('basicInput');
    input.value = '';
    bracketCount = 0;
    input.focus();
}

function backspace() {
    const input = document.getElementById('basicInput');
    const pos = input.selectionStart;
    const value = input.value;
    
    if (pos > 0) {
        // 检查是否删除括号以更新计数
        if (value[pos - 1] === '(') bracketCount--;
        else if (value[pos - 1] === ')') bracketCount++;
        
        input.value = value.slice(0, pos - 1) + value.slice(pos);
        input.setSelectionRange(pos - 1, pos - 1);
    }
    input.focus();
}

function reciprocal() {
    const input = document.getElementById('basicInput');
    const value = input.value;
    if (!value) {
        alert('请先输入一个数字！');
        return;
    }
    try {
        const result = evaluateExpression(value);
        if (result === 0) {
            alert('除数不能为0！');
            return;
        }
        input.value = (1 / result).toString();
    } catch (e) {
        alert('计算错误，请检查输入！');
    }
    input.focus();
}

// 表达式求值函数
function evaluateExpression(expr) {
    // 处理开方
    expr = expr.replace(/sqrt\((.*?)\)/g, (match, p1) => {
        return Math.sqrt(evaluateExpression(p1));
    });
    
    // 处理括号
    while (expr.includes('(')) {
        expr = expr.replace(/\(([^()]+)\)/g, (match, p1) => {
            return evaluateExpression(p1);
        });
    }
    
    // 处理乘方
    expr = expr.replace(/(-?\d*\.?\d+)\^(-?\d*\.?\d+)/g, (match, base, exp) => {
        return Math.pow(parseFloat(base), parseFloat(exp));
    });
    
    // 分割数字和运算符
    const tokens = expr.match(/(-?\d*\.?\d+|[+\-*/%^])/g) || [];
    
    // 先处理乘除、取余和乘方
    let i = 0;
    while (i < tokens.length) {
        if (['*', '/', '%', '^'].includes(tokens[i])) {
            const num1 = parseFloat(tokens[i-1]);
            const num2 = parseFloat(tokens[i+1]);
            let result;
            
            switch(tokens[i]) {
                case '*':
                    result = num1 * num2;
                    break;
                case '/':
                    if (num2 === 0) throw new Error('除数不能为0');
                    result = num1 / num2;
                    break;
                case '%':
                    result = num1 % num2;
                    break;
                case '^':
                    result = Math.pow(num1, num2);
                    break;
            }
            
            tokens.splice(i-1, 3, result.toString());
            i--;
        }
        i++;
    }
    
    // 处理加减
    let result = parseFloat(tokens[0]);
    for (i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const num = parseFloat(tokens[i+1]);
        
        if (operator === '+') result += num;
        else if (operator === '-') result -= num;
    }
    
    return result;
}

// 主计算函数
function calculate(type) {
    if (type === 'basic') {
        try {
            const input = document.getElementById('basicInput');
            let expression = input.value;
            
            // 补全未闭合的括号
            while (bracketCount > 0) {
                expression += ')';
                bracketCount--;
            }
            
            const result = evaluateExpression(expression);
            input.value = result.toString();
            input.focus();
        } catch (e) {
            alert('计算错误，请检查输入！');
        }
        return;
    }
    
    const input = document.getElementById('dataInput').value;
    const data = parseData(input);
    const result = document.getElementById('result');
    
    if (data.length === 0) {
        result.innerHTML = "请输入有效的数据";
        return;
    }

    switch(type) {
        case 'mean':
            result.innerHTML = `均值: ${calculateMean(data).toFixed(4)}`;
            break;
        case 'variance':
            result.innerHTML = `方差: ${calculateVariance(data).toFixed(4)}`;
            break;
        case 'stdDev':
            result.innerHTML = `标准差: ${calculateStdDev(data).toFixed(4)}`;
            break;
        case 'deviation':
            const deviations = calculateDeviation(data);
            result.innerHTML = `离差: [${deviations.map(d => d.toFixed(4)).join(', ')}]`;
            break;
        case 'covariance':
            calculateCovariance(data);
            break;
    }
}

// 数据处理函数
function parseData(input) {
    // 处理中文逗号
    input = input.replace(/，/g, ',');
    
    // 分割方式：
    // 1. 逗号分隔
    // 2. 空格分隔
    // 3. 换行分隔
    const numbers = input
        .split(/[\n,\s]+/)
        .map(str => str.trim())
        .filter(str => str !== '')
        .map(Number);
    
    return numbers.filter(num => !isNaN(num));
}

// 计算均值
function calculateMean(data) {
    return data.reduce((a, b) => a + b, 0) / data.length;
}

// 计算方差
function calculateVariance(data) {
    const mean = calculateMean(data);
    return data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
}

// 计算标准差
function calculateStdDev(data) {
    return Math.sqrt(calculateVariance(data));
}

// 计算离差
function calculateDeviation(data) {
    const mean = calculateMean(data);
    return data.map(x => x - mean);
}

// 计算协方差
function calculateCovariance(data) {
    const input = document.createElement('textarea');
    input.placeholder = "请输入第二组数据（支持相同的多种输入格式）";
    input.style.marginTop = "10px";
    input.style.marginBottom = "10px";
    document.querySelector('.stats-section').insertBefore(input, document.getElementById('result'));
    
    input.addEventListener('change', () => {
        const data1 = parseData(document.getElementById('dataInput').value);
        const data2 = parseData(input.value);
        
        if (data1.length !== data2.length) {
            document.getElementById('result').innerHTML = "错误：两组数据长度必须相同";
            return;
        }
        
        const mean1 = calculateMean(data1);
        const mean2 = calculateMean(data2);
        const covariance = data1.reduce((acc, val, i) => 
            acc + (val - mean1) * (data2[i] - mean2), 0) / data1.length;
        
        document.getElementById('result').innerHTML = `协方差: ${covariance.toFixed(4)}`;
        input.remove();
    });
}

// 清除数据
function clearData() {
    document.getElementById('dataInput').value = '';
    document.getElementById('result').innerHTML = '';
}

// 添加键盘事件监听
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('basicInput');
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            calculate('basic');
        } else if (e.key === 'Backspace') {
            // 让浏览器默认处理退格键
            return;
        } else if (e.key === 'Delete') {
            // 让浏览器默认处理删除键
            return;
        } else if (/[\d+\-*/.()%^]/.test(e.key)) {
            // 让浏览器默认处理数字和运算符
            return;
        } else {
            // 阻止其他按键
            e.preventDefault();
        }
    });
});
