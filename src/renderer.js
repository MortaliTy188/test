document.addEventListener('DOMContentLoaded', () => {
    const departmentElements = document.querySelectorAll('.node');
    const modal = document.getElementById('employee-modal');
    const closeBtn = document.querySelector('.close');
    let currentEmployee = null;

    function fetchEmployeesByDepartment(departmentId) {
        fetch(`http://localhost:3000/api/v1/employees/${departmentId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(employees => {
                displayEmployees(employees);
            })
            .catch(error => console.error('Ошибка:', error));
    }

    function displayEmployees(employees) {
        const employeeContainer = document.getElementById('employee-container');
        employeeContainer.innerHTML = ''; // Очистить предыдущих сотрудников

        employees.forEach(employee => {
            const employeeCard = document.createElement('div');
            employeeCard.className = 'card';
            employeeCard.dataset.employeeId = employee.id;

            employeeCard.innerHTML = `
                <div class="card-header">
                    <p class="emp-department">${employee.department.name}</p>
                    <div>-</div>
                    <p class="emp-position">${employee.position.name}</p>
                </div>
                <div class="card-main">
                    <p class="emp-name">${employee.last_name} ${employee.first_name} ${employee.middle_name || ''}</p>
                    <div><p class="emp-number">${employee.work_phone}</p> <p class="emp-email">${employee.email}</p></div>
                </div>
                <p class="emp-office">${employee.department.office.office}</p>
            `;

            employeeCard.addEventListener('click', () => {
                currentEmployee = employee;
                showEmployeeModal(employee);
            });

            employeeContainer.appendChild(employeeCard);
        });
    }

    function showEmployeeModal(employee) {
        document.getElementById('employee-name').value = `${employee.last_name} ${employee.first_name} ${employee.middle_name || ''}`;
        document.getElementById('employee-mobile').value = employee.personal_number;
        document.getElementById('employee-birthday').value = employee.birth_date;
        document.getElementById('employee-department').value = employee.department.name;
        document.getElementById('employee-position').value = employee.position.name;
        document.getElementById('employee-manager').value = employee.manager_id;
        document.getElementById('employee-assistant').value = employee.assistant_id;
        document.getElementById('employee-work-phone').value = employee.work_phone;
        document.getElementById('employee-email').value = employee.email;
        document.getElementById('employee-office').value = employee.department.office.office;
        document.getElementById('employee-info').value = employee.additional_info || '';

        modal.style.display = 'block';
        loadEmployeeTrainings(employee.id);
        loadEmployeeAbsences(employee.id);
        loadEmployeeLeaves(employee.id);
    }

    function loadEmployeeTrainings(employeeId) {
        fetch(`http://localhost:3000/api/v1/employee/${employeeId}/trainings`)
            .then(response => response.json())
            .then(trainings => {
                if (!Array.isArray(trainings)) {
                    throw new Error('Invalid response format');
                }
                displayEmployeeTrainings(trainings);
            })
            .catch(error => console.error('Ошибка загрузки обучений:', error));
    }

    function displayEmployeeTrainings(trainings) {
        const trainingList = document.getElementById('training-list');
        trainingList.innerHTML = '';

        trainings.forEach(training => {
            const trainingElement = document.createElement('div');
            trainingElement.className = 'training record'; // Добавлен класс record
            trainingElement.innerHTML = `
                <p>${training.training.date} - ${training.training.name}</p>
                <p>${training.training.description || ''}</p>
                <button class="delete-training" data-training-id="${training.training.id}">Удалить</button>
            `;

            trainingList.appendChild(trainingElement);
        });

        document.querySelectorAll('.delete-training').forEach(button => {
            button.addEventListener('click', (event) => {
                const trainingId = event.target.dataset.trainingId;
                deleteEmployeeTraining(currentEmployee.id, trainingId);
            });
        });
    }

    function loadEmployeeAbsences(employeeId) {
        fetch(`http://localhost:3000/api/v1/employee/${employeeId}/absences`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(absences => {
                if (!Array.isArray(absences)) {
                    throw new Error('Invalid response format');
                }
                displayEmployeeAbsences(absences);
            })
            .catch(error => console.error('Ошибка загрузки отгулов:', error));
    }

    function displayEmployeeAbsences(absences) {
        const absenceList = document.getElementById('absence-list');
        absenceList.innerHTML = ''; // Очистить предыдущие записи об отгулах

        absences.forEach(absence => {
            const absenceElement = document.createElement('div');
            absenceElement.className = 'absence record'; // Добавлен класс record
            absenceElement.innerHTML = `
                <p>${absence.start_date} - ${absence.end_date}</p>
                <button class="delete-absence" data-absence-id="${absence.id}">Удалить</button>
            `;

            absenceList.appendChild(absenceElement);
        });

        document.querySelectorAll('.delete-absence').forEach(button => {
            button.addEventListener('click', (event) => {
                const absenceId = event.target.dataset.absenceId;
                deleteEmployeeAbsence(currentEmployee.id, absenceId);
            });
        });
    }

    function loadEmployeeLeaves(employeeId) {
        fetch(`http://localhost:3000/api/v1/employee/${employeeId}/leaves`)
            .then(response => response.json())
            .then(leaves => {
                if (!Array.isArray(leaves)) {
                    throw new Error('Invalid response format');
                }
                displayEmployeeLeaves(leaves);
            })
            .catch(error => console.error('Ошибка загрузки отпусков:', error));
    }

    function displayEmployeeLeaves(leaves) {
        const leaveList = document.getElementById('leave-list');
        leaveList.innerHTML = ''; // Очистить предыдущие записи об отпусках

        leaves.forEach(leave => {
            const leaveElement = document.createElement('div');
            leaveElement.className = 'leave record'; // Добавлен класс record
            leaveElement.innerHTML = `
                <p>${leave.start_date} - ${leave.end_date}</p>
                <button class="delete-leave" data-leave-id="${leave.id}">Удалить</button>
            `;

            leaveList.appendChild(leaveElement);
        });

        document.querySelectorAll('.delete-leave').forEach(button => {
            button.addEventListener('click', (event) => {
                const leaveId = event.target.dataset.leaveId;
                deleteEmployeeLeave(currentEmployee.id, leaveId);
            });
        });
    }

    function deleteEmployeeAbsence(employeeId, absenceId) {
        fetch(`http://localhost:3000/api/v1/employee/${employeeId}/absences/${absenceId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                // Удалить элемент из DOM после успешного удаления
                document.querySelector(`.delete-absence[data-absence-id="${absenceId}"]`).parentElement.remove();
            })
            .catch(error => console.error('Ошибка удаления отгула:', error));
    }

    function deleteEmployeeLeave(employeeId, leaveId) {
        fetch(`http://localhost:3000/api/v1/employee/${employeeId}/leaves/${leaveId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                // Удалить элемент из DOM после успешного удаления
                document.querySelector(`.delete-leave[data-leave-id="${leaveId}"]`).parentElement.remove();
            })
            .catch(error => console.error('Ошибка удаления отпуска:', error));
    }

    function deleteEmployeeTraining(employeeId, trainingId) {
        fetch(`http://localhost:3000/api/v1/employee/${employeeId}/trainings/${trainingId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                // Удалить элемент из DOM после успешного удаления
                document.querySelector(`.delete-training[data-training-id="${trainingId}"]`).parentElement.remove();
            })
            .catch(error => console.error('Ошибка удаления обучения:', error));
    }

    function validatePhoneNumber(phoneNumber) {
        const phonePattern = /^[0-9+\(\)#\- ]{1,20}$/;
        return phonePattern.test(phoneNumber);
    }

    document.getElementById('employee-form').onsubmit = (event) => {
        event.preventDefault();
        if (!currentEmployee) {
            console.error('Нет текущего сотрудника для обновления');
            return;
        }

        const mobile = document.getElementById('employee-mobile').value;
        const workPhone = document.getElementById('employee-work-phone').value;

        if (!validatePhoneNumber(mobile) || !validatePhoneNumber(workPhone)) {
            alert('Неправильный формат телефонного номера. Пожалуйста, введите корректный номер.');
            return;
        }

        const updatedEmployee = {
            last_name: document.getElementById('employee-name').value.split(' ')[0],
            first_name: document.getElementById('employee-name').value.split(' ')[1],
            middle_name: document.getElementById('employee-name').value.split(' ')[2] || '',
            personal_number: mobile,
            birth_date: document.getElementById('employee-birthday').value,
            department: document.getElementById('employee-department').value,
            position: document.getElementById('employee-position').value,
            manager_id: document.getElementById('employee-manager').value || null,
            assistant_id: document.getElementById('employee-assistant').value || null,
            work_phone: workPhone,
            email: document.getElementById('employee-email').value,
            office: document.getElementById('employee-office').value,
            additional_info: document.getElementById('employee-info').value
        };
        updateEmployeeData(currentEmployee.id, updatedEmployee);
        modal.style.display = 'none';
    };

    function updateEmployeeData(employeeId, updatedEmployee) {
        fetch(`http://localhost:3000/api/v1/employee/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedEmployee)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Данные успешно обновлены', data);
            })
            .catch(error => {
                console.error('Ошибка обновления данных:', error);
            });
    }

    departmentElements.forEach(department => {
        department.addEventListener('click', () => {
            const departmentId = department.dataset.departmentId;

            // Удаляем класс active у всех департаментов
            departmentElements.forEach(dept => dept.classList.remove('active'));

            // Добавляем класс active к выбранному департаменту
            department.classList.add('active');

            fetchEmployeesByDepartment(departmentId);
        });
    });

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});