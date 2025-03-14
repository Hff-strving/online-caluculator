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

// 历史记录相关函数
function addToHistory(type, expression, result) {
    // 从localStorage获取现有历史记录
    let history = JSON.parse(localStorage.getItem('calculatorHistory') || '[]');
    
    // 创建新的历史记录项
    const historyItem = {
        type: type,
        expression: expression,
        result: result,
        timestamp: new Date().toLocaleString('zh-CN')
    };
    
    // 将新记录添加到开头
    history.unshift(historyItem);
    
    // 限制历史记录数量为最新的50条
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    
    // 保存到localStorage
    localStorage.setItem('calculatorHistory', JSON.stringify(history));
    
    // 更新显示
    displayHistory();
}

function displayHistory() {
    const historyList = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('calculatorHistory') || '[]');
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item" onclick="restoreCalculation('${encodeURIComponent(JSON.stringify(item))}')">
            <div class="timestamp">${item.timestamp}</div>
            <div class="expression">${item.type === 'basic' ? '表达式' : '统计计算'}: ${item.expression}</div>
            <div class="result">结果: ${item.result}</div>
        </div>
    `).join('');
}

function restoreCalculation(itemJson) {
    const item = JSON.parse(decodeURIComponent(itemJson));
    
    if (item.type === 'basic') {
        // 恢复基础计算
        const input = document.getElementById('basicInput');
        input.value = item.expression;
        input.focus();
        // 将光标移到最后
        input.setSelectionRange(input.value.length, input.value.length);
    } else {
        // 恢复统计计算
        const data = item.expression.match(/\[(.*?)\]/g);
        if (data) {
            if (item.expression.includes('协方差')) {
                // 处理协方差的两组数据
                const datasets = item.expression.match(/\[(.*?)\]/g);
                if (datasets && datasets.length >= 2) {
                    const data1 = datasets[0].slice(1, -1);  // 移除 [ ]
                    const data2 = datasets[1].slice(1, -1);  // 移除 [ ]
                    document.getElementById('dataInput1').value = data1;
                    document.getElementById('dataInput2').value = data2;
                }
            } else {
                // 处理单组数据的统计计算
                const cleanData = data[0].slice(1, -1);  // 移除 [ ]
                document.getElementById('dataInput1').value = cleanData;
                document.getElementById('dataInput2').value = '';
            }
        }
    }
    
    // 滚动到相应的计算区域
    const section = item.type === 'basic' ? 'calculator-section' : 'stats-section';
    document.querySelector(`.${section}`).scrollIntoView({ behavior: 'smooth' });
}

function clearHistory() {
    if (confirm('确定要清除所有历史记录吗？')) {
        localStorage.removeItem('calculatorHistory');
        displayHistory();
    }
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
            
            // 添加到历史记录
            addToHistory('basic', expression, result);
            
            input.focus();
        } catch (e) {
            alert('计算错误，请检查输入！');
        }
        return;
    }
    
    const input1 = document.getElementById('dataInput1').value;
    const data1 = parseData(input1);
    const result = document.getElementById('result');
    
    if (data1.length === 0) {
        result.innerHTML = "请输入有效的数据";
        return;
    }

    let calculationResult;
    let expressionText;

    switch(type) {
        case 'mean':
            calculationResult = calculateMean(data1);
            result.innerHTML = `均值: ${calculationResult.toFixed(4)}`;
            expressionText = `均值计算: [${data1.join(', ')}]`;
            break;
        case 'variance':
            calculationResult = calculateVariance(data1);
            result.innerHTML = `方差: ${calculationResult.toFixed(4)}`;
            expressionText = `方差计算: [${data1.join(', ')}]`;
            break;
        case 'stdDev':
            calculationResult = calculateStdDev(data1);
            result.innerHTML = `标准差: ${calculationResult.toFixed(4)}`;
            expressionText = `标准差计算: [${data1.join(', ')}]`;
            break;
        case 'deviation':
            calculationResult = calculateDeviation(data1);
            result.innerHTML = `离差: [${calculationResult.map(d => d.toFixed(4)).join(', ')}]`;
            expressionText = `离差计算: [${data1.join(', ')}]`;
            break;
        case 'covariance':
            const input2 = document.getElementById('dataInput2').value;
            const data2 = parseData(input2);
            
            if (data2.length === 0) {
                result.innerHTML = "请在第二个输入框中输入数据";
                return;
            }
            
            if (data1.length !== data2.length) {
                result.innerHTML = "错误：两组数据的长度必须相同";
                return;
            }
            
            calculationResult = calculateCovariance(data1, data2);
            result.innerHTML = `协方差: ${calculationResult.toFixed(4)}`;
            expressionText = `协方差计算: [${data1.join(', ')}] 和 [${data2.join(', ')}]`;
            break;
    }

    // 添加到历史记录
    addToHistory('stats', expressionText, result.innerHTML);
}

// 数据处理函数
function parseData(input) {
    // 处理中英文逗号、空格和换行符
    const cleanedInput = input.replace(/，/g, ',');
    const numbers = cleanedInput.split(/[,\s\n]+/).filter(str => str.trim() !== '');
    return numbers.map(num => parseFloat(num)).filter(num => !isNaN(num));
}

// 计算均值
function calculateMean(data) {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
}

// 计算方差
function calculateVariance(data) {
    const mean = calculateMean(data);
    // 修改为样本方差，除以(n-1)
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
}

// 计算标准差
function calculateStdDev(data) {
    return Math.sqrt(calculateVariance(data));
}

// 计算离差
function calculateDeviation(data) {
    const mean = calculateMean(data);
    return data.map(val => val - mean);
}

// 计算协方差
function calculateCovariance(data1, data2) {
    const mean1 = calculateMean(data1);
    const mean2 = calculateMean(data2);
    // 修改为样本协方差，除以(n-1)
    return data1.reduce((acc, val, i) => 
        acc + (val - mean1) * (data2[i] - mean2), 0) / (data1.length - 1);
}

// 清除数据
function clearData() {
    document.getElementById('dataInput1').value = '';
    document.getElementById('dataInput2').value = '';
    document.getElementById('result').innerHTML = '';
}

// 添加键盘事件监听
document.addEventListener('DOMContentLoaded', function() {
    displayHistory();
    
    const input = document.getElementById('basicInput');
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            calculate('basic');
        } else if (e.key === 'Backspace') {
            // 不阻止默认的退格键行为
            return;
        }
    });
});
