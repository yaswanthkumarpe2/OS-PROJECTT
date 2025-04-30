class Process {
    constructor(id, arrivalTime, burstTime, priority = 0) {
        this.id = id;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.priority = priority;
        this.remainingTime = burstTime;
        this.completionTime = 0;
        this.turnaroundTime = 0;
        this.waitingTime = 0;
        this.startTime = -1;
    }

    reset() {
        this.remainingTime = this.burstTime;
        this.completionTime = 0;
        this.turnaroundTime = 0;
        this.waitingTime = 0;
        this.startTime = -1;
    }
}

const schedulingAlgorithms = {
    fcfs(processes) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
        let currentTime = Math.max(0, processes[0]?.arrivalTime || 0);
        const timeline = [];

        processes.forEach(process => {
            if (currentTime < process.arrivalTime) {
                currentTime = process.arrivalTime;
            }
            if (process.startTime === -1) process.startTime = currentTime;
            timeline.push({ processId: process.id, startTime: currentTime, endTime: currentTime + process.burstTime });
            currentTime += process.burstTime;
            process.completionTime = currentTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
        });

        return timeline;
    },

    sjf(processes) {
        const timeline = [];
        const readyQueue = [];
        let currentTime = 0;
        const unfinishedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

        while (unfinishedProcesses.length > 0 || readyQueue.length > 0) {
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            if (readyQueue.length === 0) {
                if (unfinishedProcesses.length > 0) {
                    currentTime = unfinishedProcesses[0].arrivalTime;
                } else {
                    break;
                }
                continue;
            }

            readyQueue.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);
            const process = readyQueue.shift();

            if (process.startTime === -1) process.startTime = currentTime;
            timeline.push({ processId: process.id, startTime: currentTime, endTime: currentTime + process.burstTime });
            currentTime += process.burstTime;
            process.completionTime = currentTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
        }

        return timeline;
    },

    srtf(processes) {
        processes.forEach(p => p.reset());
        const timeline = [];
        const readyQueue = [];
        let currentTime = 0;
        const unfinishedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let currentProcess = null;

        while (unfinishedProcesses.length > 0 || readyQueue.length > 0 || currentProcess) {
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            readyQueue.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime);

            if (!currentProcess && readyQueue.length > 0) {
                currentProcess = readyQueue.shift();
                if (currentProcess.startTime === -1) currentProcess.startTime = currentTime;
            } else if (readyQueue.length > 0 && readyQueue[0].remainingTime < (currentProcess?.remainingTime || Infinity)) {
                if (currentProcess) {
                    readyQueue.push(currentProcess);
                }
                currentProcess = readyQueue.shift();
                if (currentProcess.startTime === -1) currentProcess.startTime = currentTime;
            }

            if (currentProcess) {
                if (timeline.length > 0 && timeline[timeline.length - 1].processId === currentProcess.id && timeline[timeline.length - 1].endTime === currentTime) {
                    timeline[timeline.length - 1].endTime = currentTime + 1;
                } else {
                    timeline.push({ processId: currentProcess.id, startTime: currentTime, endTime: currentTime + 1 });
                }

                currentProcess.remainingTime--;

                if (currentProcess.remainingTime === 0) {
                    currentProcess.completionTime = currentTime + 1;
                    currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                    currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                    currentProcess = null;
                }
            } else {
                if (unfinishedProcesses.length > 0) {
                    currentTime = unfinishedProcesses[0].arrivalTime;
                } else {
                    currentTime++;
                }
                continue;
            }

            currentTime++;
        }

        return timeline;
    },

    rr(processes, quantum) {
        processes.forEach(p => p.reset());
        const timeline = [];
        const readyQueue = [];
        let currentTime = Math.max(0, processes[0]?.arrivalTime || 0);
        const unfinishedProcesses = [...processes];

        while (unfinishedProcesses.length > 0 || readyQueue.length > 0) {
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            if (readyQueue.length === 0) {
                currentTime = unfinishedProcesses[0]?.arrivalTime || currentTime + 1;
                continue;
            }

            const process = readyQueue.shift();
            if (process.startTime === -1) process.startTime = currentTime;
            
            const executeTime = Math.min(quantum, process.remainingTime);
            timeline.push({ processId: process.id, startTime: currentTime, endTime: currentTime + executeTime });
            
            currentTime += executeTime;
            process.remainingTime -= executeTime;

            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            if (process.remainingTime > 0) {
                readyQueue.push(process);
            } else {
                process.completionTime = currentTime;
                process.turnaroundTime = process.completionTime - process.arrivalTime;
                process.waitingTime = process.turnaroundTime - process.burstTime;
            }
        }

        return timeline;
    },

    priorityNonPreemptive(processes) {
        const timeline = [];
        const readyQueue = [];
        let currentTime = processes.length > 0 ? Math.min(...processes.map(p => p.arrivalTime)) : 0;
        const unfinishedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

        while (unfinishedProcesses.length > 0 || readyQueue.length > 0) {
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            if (readyQueue.length === 0) {
                if (unfinishedProcesses.length > 0) {
                    currentTime = unfinishedProcesses[0].arrivalTime;
                    continue;
                }
                break;
            }

            readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
            const process = readyQueue.shift();

            if (process.startTime === -1) process.startTime = currentTime;
            timeline.push({ processId: process.id, startTime: currentTime, endTime: currentTime + process.burstTime });
            currentTime += process.burstTime;
            process.completionTime = currentTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
        }

        return timeline;
    },

    priorityPreemptive(processes) {
        processes.forEach(p => p.reset());
        const timeline = [];
        const readyQueue = [];
        let currentTime = processes.length > 0 ? Math.min(...processes.map(p => p.arrivalTime)) : 0;
        const unfinishedProcesses = [...processes].sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
        let currentProcess = null;

        while (unfinishedProcesses.length > 0 || readyQueue.length > 0 || currentProcess) {
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);

            if (!currentProcess && readyQueue.length > 0) {
                currentProcess = readyQueue.shift();
                if (currentProcess.startTime === -1) currentProcess.startTime = currentTime;
            } else if (readyQueue.length > 0 && readyQueue[0].priority < (currentProcess?.priority || Infinity)) {
                if (currentProcess) {
                    readyQueue.push(currentProcess);
                }
                currentProcess = readyQueue.shift();
                if (currentProcess.startTime === -1) currentProcess.startTime = currentTime;
            }

            if (currentProcess) {
                if (timeline.length > 0 && timeline[timeline.length - 1].processId === currentProcess.id && timeline[timeline.length - 1].endTime === currentTime) {
                    timeline[timeline.length - 1].endTime = currentTime + 1;
                } else {
                    timeline.push({ processId: currentProcess.id, startTime: currentTime, endTime: currentTime + 1 });
                }

                currentProcess.remainingTime--;

                if (currentProcess.remainingTime === 0) {
                    currentProcess.completionTime = currentTime + 1;
                    currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                    currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                    currentProcess = null;
                }
            } else {
                if (unfinishedProcesses.length > 0) {
                    currentTime = unfinishedProcesses[0].arrivalTime;
                } else if (readyQueue.length === 0) {
                    break;
                } else {
                    currentTime++;
                }
                continue;
            }

            currentTime++;
        }

        return timeline;
    }
};

const exampleData = {
    fcfs: {
        processCount: 4,
        processes: [
            { arrivalTime: 0, burstTime: 5, priority: 0 },
            { arrivalTime: 1, burstTime: 3, priority: 0 },
            { arrivalTime: 2, burstTime: 8, priority: 0 },
            { arrivalTime: 3, burstTime: 6, priority: 0 }
        ],
        quantum: 2
    },
    sjf: {
        processCount: 4,
        processes: [
            { arrivalTime: 0, burstTime: 7, priority: 0 },
            { arrivalTime: 2, burstTime: 4, priority: 0 },
            { arrivalTime: 4, burstTime: 1, priority: 0 },
            { arrivalTime: 5, burstTime: 4, priority: 0 }
        ],
        quantum: 2
    },
    srtf: {
        processCount: 4,
        processes: [
            { arrivalTime: 0, burstTime: 8, priority: 0 },
            { arrivalTime: 1, burstTime: 4, priority: 0 },
            { arrivalTime: 2, burstTime: 9, priority: 0 },
            { arrivalTime: 3, burstTime: 5, priority: 0 }
        ],
        quantum: 2
    },
    rr: {
        processCount: 4,
        processes: [
            { arrivalTime: 0, burstTime: 5, priority: 0 },
            { arrivalTime: 1, burstTime: 4, priority: 0 },
            { arrivalTime: 2, burstTime: 3, priority: 0 },
            { arrivalTime: 3, burstTime: 2, priority: 0 }
        ],
        quantum: 2
    },
    priorityNonPreemptive: {
        processCount: 4,
        processes: [
            { arrivalTime: 0, burstTime: 10, priority: 3 },
            { arrivalTime: 1, burstTime: 6, priority: 1 },
            { arrivalTime: 2, burstTime: 3, priority: 4 },
            { arrivalTime: 3, burstTime: 5, priority: 2 }
        ],
        quantum: 2
    },
    priorityPreemptive: {
        processCount: 4,
        processes: [
            { arrivalTime: 0, burstTime: 10, priority: 3 },
            { arrivalTime: 1, burstTime: 6, priority: 1 },
            { arrivalTime: 2, burstTime: 3, priority: 4 },
            { arrivalTime: 3, burstTime: 5, priority: 2 }
        ],
        quantum: 2
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const algorithmSelect = document.getElementById('algorithm');
    const processCountInput = document.getElementById('process-count');
    const processTableBody = document.getElementById('process-table-body');
    const calculateButton = document.getElementById('calculate');
    const exampleButton = document.getElementById('example-button');
    const resultsSection = document.getElementById('results');
    const quantumInput = document.getElementById('quantum-input');
    const priorityColumns = document.getElementsByClassName('priority-column');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const dismissError = document.querySelector('.dismiss-error');
    const loadingSpinner = document.getElementById('loading-spinner');
    let isValid = false;
    let lastResult = null;

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    function highlightInvalidField(input) {
        input.classList.add('invalid');
        input.addEventListener('input', () => input.classList.remove('invalid'), { once: true });
    }

    function validateInputs() {
        const rows = processTableBody.getElementsByTagName('tr');
        const algorithm = algorithmSelect.value;
        let valid = true;

        if (rows.length === 0) {
            showError('Please add at least one process.');
            valid = false;
        }

        for (let i = 0; i < rows.length; i++) {
            const arrivalTimeInput = rows[i].querySelector('.arrival-time');
            const burstTimeInput = rows[i].querySelector('.burst-time');
            const priorityInput = rows[i].querySelector('.priority-value');

            const arrivalTime = parseInt(arrivalTimeInput.value);
            const burstTime = parseInt(burstTimeInput.value);
            const priority = priorityInput ? parseInt(priorityInput.value) : 0;

            if (isNaN(arrivalTime) || arrivalTime < 0 || arrivalTime > 1000) {
                showError('Arrival time must be an integer between 0 and 1000.');
                highlightInvalidField(arrivalTimeInput);
                valid = false;
            }
            if (isNaN(burstTime) || burstTime <= 0 || burstTime > 1000) {
                showError('Burst time must be an integer between 1 and 1000.');
                highlightInvalidField(burstTimeInput);
                valid = false;
            }
            if ((algorithm === 'priorityNonPreemptive' || algorithm === 'priorityPreemptive') && 
                (isNaN(priority) || priority <= 0 || priority > 100)) {
                showError('Priority must be an integer between 1 and 100.');
                highlightInvalidField(priorityInput);
                valid = false;
            }
        }

        if (algorithm === 'rr') {
            const quantumInput = document.getElementById('time-quantum');
            const quantum = parseInt(quantumInput.value);
            if (isNaN(quantum) || quantum <= 0 || quantum > 100) {
                showError('Time quantum must be an integer between 1 and 100.');
                highlightInvalidField(quantumInput);
                valid = false;
            }
        }

        isValid = valid;
        calculateButton.disabled = !valid;
    }

    function updateProcessTable() {
        const count = Math.min(Math.max(parseInt(processCountInput.value) || 1, 1), 10);
        processCountInput.value = count;
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < count; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>P${i + 1}</td>
                <td><input type="number" class="input-field arrival-time" min="0" step="1" value="0" aria-label="Arrival time for process ${i + 1}"></td>
                <td><input type="number" class="input-field burst-time" min="1" step="1" value="1" aria-label="Burst time for process ${i + 1}"></td>
                ${(algorithmSelect.value === 'priorityNonPreemptive' || algorithmSelect.value === 'priorityPreemptive') ? 
                    `<td><input type="number" class="input-field priority-value" min="1" step="1" value="1" aria-label="Priority for process ${i + 1}"></td>` : 
                    '<td class="priority-column hidden"></td>'}
            `;
            fragment.appendChild(row);
        }

        processTableBody.innerHTML = '';
        processTableBody.appendChild(fragment);
        validateInputs();
        resultsSection.classList.add('hidden');
    }

    function loadExampleData() {
        const algorithm = algorithmSelect.value;
        const example = exampleData[algorithm];
        
        // Update process count
        processCountInput.value = example.processCount;
        updateProcessTable();
        
        // Fill process table
        const rows = processTableBody.getElementsByTagName('tr');
        example.processes.forEach((proc, index) => {
            if (index < rows.length) {
                const row = rows[index];
                row.querySelector('.arrival-time').value = proc.arrivalTime;
                row.querySelector('.burst-time').value = proc.burstTime;
                if (algorithm === 'priorityNonPreemptive' || algorithm === 'priorityPreemptive') {
                    row.querySelector('.priority-value').value = proc.priority;
                }
            }
        });

        if (algorithm === 'rr') {
            document.getElementById('time-quantum').value = example.quantum;
        }

        validateInputs();
        resultsSection.classList.add('hidden');
        lastResult = null;
    }

    function togglePriorityColumn() {
        const isPriority = algorithmSelect.value === 'priorityNonPreemptive' || algorithmSelect.value === 'priorityPreemptive';
        Array.from(priorityColumns).forEach(col => {
            col.classList.toggle('hidden', !isPriority);
        });
        updateProcessTable();
    }

    function toggleQuantumInput() {
        quantumInput.classList.toggle('hidden', algorithmSelect.value !== 'rr');
        validateInputs();
    }

    function getProcesses() {
        const processes = [];
        const rows = processTableBody.getElementsByTagName('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const arrivalTime = parseInt(rows[i].querySelector('.arrival-time').value) || 0;
            const burstTime = parseInt(rows[i].querySelector('.burst-time').value) || 1;
            const priority = rows[i].querySelector('.priority-value') ? 
                parseInt(rows[i].querySelector('.priority-value').value) || 1 : 0;
            
            processes.push(new Process(i + 1, arrivalTime, burstTime, priority));
        }
        
        return processes;
    }

    function getInputHash() {
        const processes = getProcesses();
        const algorithm = algorithmSelect.value;
        const quantum = algorithm === 'rr' ? document.getElementById('time-quantum').value : '';
        return JSON.stringify({ processes, algorithm, quantum });
    }

    function displayResults(processes, timeline) {
        resultsSection.classList.remove('hidden');
        
        const ganttContainer = document.getElementById('gantt-container');
        const ganttTimeline = document.getElementById('gantt-timeline');
        ganttContainer.innerHTML = '';
        ganttTimeline.innerHTML = '';
        
        const lastEndTime = timeline.length ? Math.max(...timeline.map(t => t.endTime)) : 0;
        const scaleFactor = Math.min(40, Math.max(10, 1000 / (lastEndTime || 1)));

        const ganttFragment = document.createDocumentFragment();
        timeline.forEach(({ processId, startTime, endTime }) => {
            const block = document.createElement('div');
            block.className = 'gantt-block';
            block.style.width = `${(endTime - startTime) * scaleFactor}px`;
            block.textContent = `P${processId}`;
            block.setAttribute('aria-label', `Process ${processId} from ${startTime} to ${endTime}`);
            ganttFragment.appendChild(block);
        });
        ganttContainer.appendChild(ganttFragment);

        const timelineFragment = document.createDocumentFragment();
        const uniqueTimes = [...new Set(timeline.flatMap(t => [t.startTime, t.endTime]))].sort((a, b) => a - b);
        uniqueTimes.forEach(time => {
            const mark = document.createElement('div');
            mark.className = 'timeline-mark';
            mark.textContent = time;
            mark.style.width = `${scaleFactor}px`;
            mark.style.left = `${time * scaleFactor}px`;
            timelineFragment.appendChild(mark);
        });
        ganttTimeline.appendChild(timelineFragment);

        const metricsTableBody = document.getElementById('metrics-table-body');
        metricsTableBody.innerHTML = '';
        const metricsFragment = document.createDocumentFragment();
        
        let totalCT = 0, totalTAT = 0, totalWT = 0;
        
        processes.forEach(process => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>P${process.id}</td>
                <td>${process.completionTime}</td>
                <td>${process.turnaroundTime}</td>
                <td>${process.waitingTime}</td>
            `;
            metricsFragment.appendChild(row);
            
            totalCT += process.completionTime;
            totalTAT += process.turnaroundTime;
            totalWT += process.waitingTime;
        });
        metricsTableBody.appendChild(metricsFragment);

        document.getElementById('avg-ct').textContent = processes.length ? (totalCT / processes.length).toFixed(2) : 0;
        document.getElementById('avg-tat').textContent = processes.length ? (totalTAT / processes.length).toFixed(2) : 0;
        document.getElementById('avg-wt').textContent = processes.length ? (totalWT / processes.length).toFixed(2) : 0;
    }

    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    algorithmSelect.addEventListener('change', () => {
        togglePriorityColumn();
        toggleQuantumInput();
        resultsSection.classList.add('hidden');
        lastResult = null;
    });

    processCountInput.addEventListener('input', debounce(updateProcessTable, 300));

    processTableBody.addEventListener('input', debounce(() => {
        validateInputs();
        resultsSection.classList.add('hidden');
        lastResult = null;
    }, 200));

    document.getElementById('time-quantum').addEventListener('input', debounce(() => {
        validateInputs();
        resultsSection.classList.add('hidden');
        lastResult = null;
    }, 200));

    dismissError.addEventListener('click', () => {
        errorMessage.classList.add('hidden');
    });

    exampleButton.addEventListener('click', loadExampleData);

    calculateButton.addEventListener('click', () => {
        if (!isValid) return;

        const inputHash = getInputHash();
        if (lastResult && lastResult.hash === inputHash) {
            displayResults(lastResult.processes, lastResult.timeline);
            return;
        }

        calculateButton.disabled = true;
        loadingSpinner.classList.remove('hidden');

        setTimeout(() => {
            try {
                const processes = getProcesses();
                const algorithm = algorithmSelect.value;
                let timeline;

                if (algorithm === 'rr') {
                    const quantum = parseInt(document.getElementById('time-quantum').value) || 1;
                    timeline = schedulingAlgorithms[algorithm](processes, quantum);
                } else {
                    timeline = schedulingAlgorithms[algorithm](processes);
                }

                lastResult = { hash: inputHash, processes, timeline };
                displayResults(processes, timeline);
            } catch (error) {
                showError('Error during calculation: ' + error.message);
            } finally {
                calculateButton.disabled = false;
                loadingSpinner.classList.add('hidden');
            }
        }, 0);
    });

    updateProcessTable();
    togglePriorityColumn();
    toggleQuantumInput();
});