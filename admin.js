document.addEventListener('DOMContentLoaded', () => {
    let appState = {};
    
    // Configured list of simple string fields
    const simpleFields = [
        'heroBadge', 'heroFirstName', 'heroLastName', 'heroTagline',
        'aboutP1', 'aboutP2', 'aboutP3',
        'stat1Value', 'stat1Label', 'stat2Value', 'stat2Label', 'stat3Value', 'stat3Label',
        'themePreset', 'animationPreset', 'profileAnimPreset'
    ];

    // Helper: Escapes HTML strings to prevent breaking inputs
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Helper: Swaps items in an array
    function swapItems(arr, indexA, indexB) {
        if (indexA < 0 || indexA >= arr.length || indexB < 0 || indexB >= arr.length) return;
        const temp = arr[indexA];
        arr[indexA] = arr[indexB];
        arr[indexB] = temp;
    }

    // Helper: Upload file to /api/upload
    function uploadFile(file, filename) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result;
                fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, base64 })
                })
                .then(res => {
                    if (!res.ok) throw new Error('Upload failed');
                    return res.json();
                })
                .then(resolve)
                .catch(reject);
            };
            reader.onerror = error => reject(error);
        });
    }

    // Profile Image upload listener
    const profileInput = document.getElementById('profileImageInput');
    const profileStatus = document.getElementById('profileImageUploadStatus');
    const profilePreview = document.getElementById('profileImagePreview');
    
    if (profileInput) {
        profileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            profileStatus.textContent = 'Uploading...';
            profileStatus.className = 'upload-status-text info';
            
            uploadFile(file, 'profile.png')
                .then(res => {
                    if (res.success) {
                        profilePreview.src = 'images/profile.png?t=' + Date.now();
                        profileStatus.textContent = 'Uploaded successfully!';
                        profileStatus.className = 'upload-status-text success';
                        showToast('Profile image updated successfully.', 'success');
                    } else {
                        throw new Error('Upload unsuccessful');
                    }
                })
                .catch(err => {
                    console.error(err);
                    profileStatus.textContent = 'Upload failed.';
                    profileStatus.className = 'upload-status-text error';
                    showToast('Failed to upload profile image.', 'error');
                });
        });
    }

    // Custom Toast Notifications
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if (type === 'success') {
            icon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--success-color);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        } else if (type === 'error') {
            icon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--danger-color);"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        } else {
            icon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--accent-color);"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `
            ${icon}
            <div class="toast-message">${escapeHtml(message)}</div>
            <span class="toast-close">×</span>
        `;
        
        container.appendChild(toast);
        
        // Force Reflow & Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto Remove after 4s
        const dismissTimer = setTimeout(() => dismissToast(toast), 4000);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(dismissTimer);
            dismissToast(toast);
        });
    }

    function dismissToast(toast) {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }

    // --- Tab Switching Navigation ---
    const menuItems = document.querySelectorAll('.menu-item');
    const panels = document.querySelectorAll('.tab-panel');
    const panelTitle = document.getElementById('panelTitle');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            item.classList.add('active');
            const targetTab = item.dataset.tab;
            const targetPanel = document.getElementById(`tab-${targetTab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            panelTitle.textContent = item.textContent.trim();
        });
    });

    // --- Dynamic Editors Rendering ---

    // 1. Experience Timeline Editor
    function renderExperience() {
        const list = document.getElementById('experienceList');
        list.innerHTML = '';
        
        if (!appState.experienceData || !Array.isArray(appState.experienceData)) {
            appState.experienceData = [];
        }

        appState.experienceData.forEach((exp, idx) => {
            const card = document.createElement('div');
            card.className = 'editor-card';
            card.innerHTML = `
                <div class="card-controls">
                    <button class="btn-icon move-up" ${idx === 0 ? 'disabled' : ''} title="Move Up">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </button>
                    <button class="btn-icon move-down" ${idx === appState.experienceData.length - 1 ? 'disabled' : ''} title="Move Down">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <button class="btn-icon danger-hover delete-item" title="Delete Node">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <div class="card-fields">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Period / Duration</label>
                            <input type="text" class="exp-date" value="${escapeHtml(exp.date)}" placeholder="e.g. Mar 2023 - Present">
                        </div>
                        <div class="form-group">
                            <label>Professional Designation</label>
                            <input type="text" class="exp-title" value="${escapeHtml(exp.title)}" placeholder="e.g. IT Executive">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Company / Organization</label>
                        <input type="text" class="exp-company" value="${escapeHtml(exp.company)}" placeholder="e.g. AAT Sri Lanka">
                    </div>
                    <div class="form-group">
                        <label>Key Responsibilities & Description</label>
                        <textarea class="exp-description" rows="3" placeholder="Describe your achievements and duties...">${escapeHtml(exp.description)}</textarea>
                    </div>
                </div>
            `;
            
            // Listeners for updates
            card.querySelector('.exp-date').addEventListener('input', (e) => exp.date = e.target.value);
            card.querySelector('.exp-title').addEventListener('input', (e) => exp.title = e.target.value);
            card.querySelector('.exp-company').addEventListener('input', (e) => exp.company = e.target.value);
            card.querySelector('.exp-description').addEventListener('input', (e) => exp.description = e.target.value);
            
            card.querySelector('.move-up').addEventListener('click', () => {
                swapItems(appState.experienceData, idx, idx - 1);
                renderExperience();
            });
            
            card.querySelector('.move-down').addEventListener('click', () => {
                swapItems(appState.experienceData, idx, idx + 1);
                renderExperience();
            });
            
            card.querySelector('.delete-item').addEventListener('click', () => {
                appState.experienceData.splice(idx, 1);
                renderExperience();
                showToast('Timeline item removed locally.', 'info');
            });
            
            list.appendChild(card);
        });
    }

    // 2. Skill Matrix Editor
    function renderSkills() {
        const list = document.getElementById('skillsList');
        list.innerHTML = '';
        
        if (!appState.skillsData || !Array.isArray(appState.skillsData)) {
            appState.skillsData = [];
        }

        appState.skillsData.forEach((skillCat, idx) => {
            const block = document.createElement('div');
            block.className = 'skill-category-block';
            block.innerHTML = `
                <div class="skill-category-header">
                    <input type="text" class="category-name" value="${escapeHtml(skillCat.category)}" placeholder="Category Name">
                    <div class="skill-category-controls">
                        <button class="btn-icon move-up" ${idx === 0 ? 'disabled' : ''} title="Move Up">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        </button>
                        <button class="btn-icon move-down" ${idx === appState.skillsData.length - 1 ? 'disabled' : ''} title="Move Down">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <button class="btn-icon danger-hover delete-cat" title="Delete Category">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="skill-tag-manager">
                    <div class="skill-chips-container">
                        ${skillCat.skills.map((skill, sIdx) => `
                            <span class="skill-chip">
                                ${escapeHtml(skill)}
                                <span class="remove-tag" data-index="${sIdx}">×</span>
                            </span>
                        `).join('')}
                    </div>
                    <div class="skill-tag-input-container">
                        <input type="text" class="new-tag-input" placeholder="Type a skill and press Enter or click Add...">
                        <button class="btn secondary add-tag-btn">Add Skill</button>
                    </div>
                </div>
            `;
            
            // Name updates
            block.querySelector('.category-name').addEventListener('input', (e) => skillCat.category = e.target.value);
            
            block.querySelector('.move-up').addEventListener('click', () => {
                swapItems(appState.skillsData, idx, idx - 1);
                renderSkills();
            });
            
            block.querySelector('.move-down').addEventListener('click', () => {
                swapItems(appState.skillsData, idx, idx + 1);
                renderSkills();
            });
            
            block.querySelector('.delete-cat').addEventListener('click', () => {
                appState.skillsData.splice(idx, 1);
                renderSkills();
                showToast('Skill Category deleted locally.', 'info');
            });
            
            // Remove Tag
            block.querySelectorAll('.remove-tag').forEach(badgeBtn => {
                badgeBtn.addEventListener('click', (e) => {
                    const sIdx = parseInt(e.target.dataset.index);
                    skillCat.skills.splice(sIdx, 1);
                    renderSkills();
                });
            });
            
            // Add Tag
            const input = block.querySelector('.new-tag-input');
            const addBtn = block.querySelector('.add-tag-btn');
            
            const handleAdd = () => {
                const val = input.value.trim();
                if (val) {
                    if (!skillCat.skills.includes(val)) {
                        skillCat.skills.push(val);
                        renderSkills();
                    } else {
                        showToast('Skill tag already exists in this category.', 'info');
                        input.value = '';
                    }
                }
            };
            
            addBtn.addEventListener('click', handleAdd);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                }
            });
            
            list.appendChild(block);
        });
    }

    // 3. Projects Showcase Editor
    function renderProjects() {
        const list = document.getElementById('projectsList');
        list.innerHTML = '';
        
        if (!appState.projectsData || !Array.isArray(appState.projectsData)) {
            appState.projectsData = [];
        }

        appState.projectsData.forEach((proj, idx) => {
            const card = document.createElement('div');
            card.className = 'editor-card';
            card.innerHTML = `
                <div class="card-controls">
                    <button class="btn-icon move-up" ${idx === 0 ? 'disabled' : ''} title="Move Up">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </button>
                    <button class="btn-icon move-down" ${idx === appState.projectsData.length - 1 ? 'disabled' : ''} title="Move Down">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <button class="btn-icon danger-hover delete-item" title="Delete Project">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <div class="card-fields">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Project Title</label>
                            <input type="text" class="proj-title" value="${escapeHtml(proj.title)}" placeholder="e.g. Enterprise Network Monitor">
                        </div>
                        <div class="form-group">
                            <label>Filter Tag Category</label>
                            <select class="proj-category">
                                <option value="infrastructure" ${proj.category === 'infrastructure' ? 'selected' : ''}>Infrastructure</option>
                                <option value="development" ${proj.category === 'development' ? 'selected' : ''}>Development</option>
                                <option value="automation" ${proj.category === 'automation' ? 'selected' : ''}>Automation</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Deployment / Architecture Link</label>
                        <input type="text" class="proj-link" value="${escapeHtml(proj.link)}" placeholder="e.g. # or github url">
                    </div>
                    <div class="form-group">
                        <label>Brief Description</label>
                        <textarea class="proj-description" rows="3" placeholder="Describe the technical details of this project...">${escapeHtml(proj.description)}</textarea>
                    </div>
                    
                    <div class="project-tag-input-group">
                        <label style="font-size: 0.75rem; margin-bottom: 0.5rem; color: var(--text-secondary);">Tech Stack Chips</label>
                        <div class="skill-chips-container">
                            ${proj.tags.map((tag, tIdx) => `
                                <span class="skill-chip">
                                    ${escapeHtml(tag)}
                                    <span class="remove-proj-tag" data-index="${tIdx}">×</span>
                                </span>
                            `).join('')}
                        </div>
                        <div class="skill-tag-input-container">
                            <input type="text" class="new-proj-tag-input" placeholder="Type a tech tag (e.g. Fortinet API) and press Enter...">
                            <button class="btn secondary add-proj-tag-btn">Add Tag</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Value updates listeners
            card.querySelector('.proj-title').addEventListener('input', (e) => proj.title = e.target.value);
            card.querySelector('.proj-category').addEventListener('change', (e) => proj.category = e.target.value);
            card.querySelector('.proj-link').addEventListener('input', (e) => proj.link = e.target.value);
            card.querySelector('.proj-description').addEventListener('input', (e) => proj.description = e.target.value);
            
            card.querySelector('.move-up').addEventListener('click', () => {
                swapItems(appState.projectsData, idx, idx - 1);
                renderProjects();
            });
            
            card.querySelector('.move-down').addEventListener('click', () => {
                swapItems(appState.projectsData, idx, idx + 1);
                renderProjects();
            });
            
            card.querySelector('.delete-item').addEventListener('click', () => {
                appState.projectsData.splice(idx, 1);
                renderProjects();
                showToast('Project deleted locally.', 'info');
            });
            
            // Remove Tag
            card.querySelectorAll('.remove-proj-tag').forEach(tagBtn => {
                tagBtn.addEventListener('click', (e) => {
                    const tIdx = parseInt(e.target.dataset.index);
                    proj.tags.splice(tIdx, 1);
                    renderProjects();
                });
            });
            
            // Add Tag
            const input = card.querySelector('.new-proj-tag-input');
            const addBtn = card.querySelector('.add-proj-tag-btn');
            
            const handleAddTag = () => {
                const val = input.value.trim();
                if (val) {
                    if (!proj.tags.includes(val)) {
                        proj.tags.push(val);
                        renderProjects();
                    } else {
                        showToast('Tech tag already exists for this project.', 'info');
                        input.value = '';
                    }
                }
            };
            
            addBtn.addEventListener('click', handleAddTag);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                }
            });
            
            list.appendChild(card);
        });
    }

    // 4. Certifications Editor
    function renderCertifications() {
        const list = document.getElementById('certsList');
        list.innerHTML = '';
        
        if (!appState.certsData || !Array.isArray(appState.certsData)) {
            appState.certsData = [];
        }

        appState.certsData.forEach((cert, idx) => {
            const card = document.createElement('div');
            card.className = 'editor-card';
            card.innerHTML = `
                <div class="card-controls">
                    <button class="btn-icon move-up" ${idx === 0 ? 'disabled' : ''} title="Move Up">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </button>
                    <button class="btn-icon move-down" ${idx === appState.certsData.length - 1 ? 'disabled' : ''} title="Move Down">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <button class="btn-icon danger-hover delete-item" title="Delete Credentials">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <div class="card-fields">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Certification Name</label>
                            <input type="text" class="cert-title" value="${escapeHtml(cert.title)}" placeholder="e.g. CompTIA A+">
                        </div>
                        <div class="form-group">
                            <label>Issuer / Body</label>
                            <input type="text" class="cert-issuer" value="${escapeHtml(cert.issuer)}" placeholder="e.g. A+ Academy">
                        </div>
                    </div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Year / Date</label>
                            <input type="text" class="cert-date" value="${escapeHtml(cert.date)}" placeholder="e.g. 2024">
                        </div>
                        <div class="form-group">
                            <!-- spacer -->
                        </div>
                    </div>
                    
                    <div class="proof-upload-block" style="margin-bottom: 0.75rem;">
                        <div class="proof-info-side">
                            <label style="font-size: 0.7rem; margin-bottom: 0.25rem;">Front Side / Page 1</label>
                            <div class="proof-path-text front-path">
                                ${cert.file ? `<a href="${cert.file}" target="_blank">${escapeHtml(cert.file)} ↗</a>` : 'No file uploaded yet'}
                            </div>
                        </div>
                        <div class="proof-actions-side">
                            <input type="file" class="cert-file-input cert-front-input" accept="image/*,application/pdf" style="display:none;" id="cert-front-${idx}">
                            <button type="button" class="btn secondary btn-upload btn-front" onclick="document.getElementById('cert-front-${idx}').click()">
                                Upload Front (PDF/Image)
                            </button>
                        </div>
                    </div>

                    <div class="proof-upload-block">
                        <div class="proof-info-side">
                            <label style="font-size: 0.7rem; margin-bottom: 0.25rem;">Back Side / Page 2 (Optional)</label>
                            <div class="proof-path-text back-path">
                                ${cert.file2 ? `<a href="${cert.file2}" target="_blank">${escapeHtml(cert.file2)} ↗</a>` : 'No file uploaded yet'}
                            </div>
                        </div>
                        <div class="proof-actions-side">
                            <input type="file" class="cert-file-input cert-back-input" accept="image/*,application/pdf" style="display:none;" id="cert-back-${idx}">
                            <button type="button" class="btn secondary btn-upload btn-back" onclick="document.getElementById('cert-back-${idx}').click()">
                                Upload Back (PDF/Image)
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Listeners
            card.querySelector('.cert-title').addEventListener('input', (e) => cert.title = e.target.value);
            card.querySelector('.cert-issuer').addEventListener('input', (e) => cert.issuer = e.target.value);
            card.querySelector('.cert-date').addEventListener('input', (e) => cert.date = e.target.value);
            
            card.querySelector('.move-up').addEventListener('click', () => {
                swapItems(appState.certsData, idx, idx - 1);
                renderCertifications();
            });
            
            card.querySelector('.move-down').addEventListener('click', () => {
                swapItems(appState.certsData, idx, idx + 1);
                renderCertifications();
            });
            
            card.querySelector('.delete-item').addEventListener('click', () => {
                appState.certsData.splice(idx, 1);
                renderCertifications();
                showToast('Certification item removed locally.', 'info');
            });
            
            // File Upload Listener - Front
            const fileInputFront = card.querySelector('.cert-front-input');
            const uploadBtnFront = card.querySelector('.btn-front');
            fileInputFront.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                uploadBtnFront.textContent = 'Uploading...';
                uploadBtnFront.disabled = true;
                
                uploadFile(file, file.name)
                    .then(res => {
                        if (res.success) {
                            cert.file = res.url;
                            renderCertifications();
                            showToast('Certificate front side uploaded successfully.', 'success');
                            
                            // Automatically trigger AI auto-identification
                            const allCards = list.querySelectorAll('.editor-card');
                            const targetCard = allCards[idx];
                            if (targetCard) {
                                analyzeCertificateFile(file, targetCard, cert);
                            }
                        } else {
                            throw new Error('Upload unsuccessful');
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        uploadBtnFront.textContent = 'Upload Failed';
                        uploadBtnFront.disabled = false;
                        showToast('Failed to upload front side.', 'error');
                    });
            });

            // File Upload Listener - Back
            const fileInputBack = card.querySelector('.cert-back-input');
            const uploadBtnBack = card.querySelector('.btn-back');
            fileInputBack.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                uploadBtnBack.textContent = 'Uploading...';
                uploadBtnBack.disabled = true;
                
                uploadFile(file, file.name)
                    .then(res => {
                        if (res.success) {
                            cert.file2 = res.url;
                            renderCertifications();
                            showToast('Certificate back side uploaded successfully.', 'success');
                        } else {
                            throw new Error('Upload unsuccessful');
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        uploadBtnBack.textContent = 'Upload Failed';
                        uploadBtnBack.disabled = false;
                        showToast('Failed to upload back side.', 'error');
                    });
            });
            
            list.appendChild(card);
        });
    }

    // --- Setup Creation Triggers ---
    
    // Add Experience Card
    document.getElementById('addExpBtn').addEventListener('click', () => {
        appState.experienceData.unshift({
            date: '',
            title: 'New Position Title',
            company: 'New Company / Organization',
            description: ''
        });
        renderExperience();
        showToast('Added empty experience card.', 'info');
    });

    // Add Skill Category
    document.getElementById('addSkillCatBtn').addEventListener('click', () => {
        appState.skillsData.push({
            category: 'New Category Name',
            skills: []
        });
        renderSkills();
        showToast('Created new skill category.', 'info');
    });

    // Add Project Card
    document.getElementById('addProjectBtn').addEventListener('click', () => {
        appState.projectsData.unshift({
            title: 'New Showcase Project',
            category: 'development',
            description: '',
            link: '#',
            tags: []
        });
        renderProjects();
        showToast('Added empty project template.', 'info');
    });

    // Add Certificate Card
    document.getElementById('addCertBtn').addEventListener('click', () => {
        if (!appState.certsData) appState.certsData = [];
        appState.certsData.unshift({
            title: 'New Professional Credential',
            issuer: 'Issuing Organization',
            date: new Date().getFullYear().toString(),
            file: ''
        });
        renderCertifications();
        showToast('Added empty certification template.', 'info');
    });

    // --- Detect server mode vs static/GitHub Pages mode ---
    let isServerAvailable = false;

    function showServerBanner(available) {
        isServerAvailable = available;
        const existingBanner = document.getElementById('server-mode-banner');
        if (existingBanner) existingBanner.remove();

        const header = document.querySelector('.main-header');
        const banner = document.createElement('div');
        banner.id = 'server-mode-banner';

        if (available) {
            banner.className = 'server-banner server-online';
            banner.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <strong>Server Online</strong> — Full edit & save mode active.
            `;
        } else {
            banner.className = 'server-banner server-offline';
            banner.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <strong>Read-Only Mode</strong> — Viewing static data from GitHub Pages. To save changes, run <code>node server.js</code> locally and access <code>localhost:8000/admin.html</code>.
            `;
            // Disable save button
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.title = 'Start local server to enable saving';
            }
        }

        if (header) header.after(banner);
        if (!available) {
            refreshServerBanner();
        }
    }

    // --- Load Data: try API first, fall back to static data.json ---
    function populateFormFields(data) {
        appState = data;
        simpleFields.forEach(field => {
            const el = document.getElementById(field);
            if (el && appState[field] !== undefined) {
                el.value = appState[field];
            }
        });
        renderExperience();
        renderSkills();
        renderProjects();
        renderCertifications();
    }

    fetch('/api/content')
        .then(res => {
            if (!res.ok) throw new Error('API not available');
            return res.json();
        })
        .then(data => {
            showServerBanner(true);
            populateFormFields(data);
            showToast('Portfolio configuration loaded successfully.', 'info');
        })
        .catch(() => {
            // API unavailable — try reading static data.json directly
            fetch('data.json')
                .then(res => {
                    if (!res.ok) throw new Error('data.json not found');
                    return res.json();
                })
                .then(data => {
                    showServerBanner(false);
                    populateFormFields(data);
                    showToast('Loaded static portfolio data (read-only).', 'info');
                })
                .catch(() => {
                    showServerBanner(false);
                    showToast('Could not load portfolio data.', 'error');
                });
        });


    // --- Save Data Trigger ---
    document.getElementById('saveBtn').addEventListener('click', async () => {
        // Collect simple text fields before saving
        simpleFields.forEach(field => {
            const el = document.getElementById(field);
            if (el) {
                appState[field] = el.value;
            }
        });

        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            if (isServerAvailable) {
                // Local server mode
                const res = await fetch('/api/content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appState)
                });
                if (!res.ok) throw new Error('Save failed');
                showToast('All modifications saved successfully!', 'success');
            } else {
                // GitHub API mode
                const s = getGhSettings();
                if (!s.owner || !s.repo || !s.token) {
                    showToast('Save is disabled in read-only mode. Configure GitHub Integration in Settings to save from GitHub Pages.', 'error');
                    return;
                }
                await saveViaGitHub(appState);
                showToast('✅ Saved! Committed to GitHub — Pages will rebuild in ~1 min.', 'success');
            }
        } catch (err) {
            console.error('Save error:', err);
            showToast(`Save failed: ${err.message}`, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    });

    // --- Settings & Credentials Form ---
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('adminUsernameInput').value.trim();
            const password = document.getElementById('adminPasswordInput').value;
            const confirmPass = document.getElementById('adminPasswordConfirmInput').value;

            if (!username) {
                showToast('Username cannot be empty.', 'error');
                return;
            }
            if (password !== confirmPass) {
                showToast('Passwords do not match.', 'error');
                return;
            }
            if (password.length < 4) {
                showToast('Password should be at least 4 characters.', 'error');
                return;
            }

            const updateBtn = document.getElementById('updateCredsBtn');
            updateBtn.textContent = 'Updating...';
            updateBtn.disabled = true;

            fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            .then(res => {
                if (res.ok) {
                    showToast('Credentials updated successfully. Please note down your new credentials!', 'success');
                    document.getElementById('adminPasswordInput').value = '';
                    document.getElementById('adminPasswordConfirmInput').value = '';
                } else {
                    return res.json().then(data => {
                        throw new Error(data.error || 'Failed to update credentials');
                    });
                }
            })
            .catch(err => {
                console.error(err);
                showToast(err.message || 'Error updating credentials.', 'error');
            })
            .finally(() => {
                updateBtn.textContent = 'Update Credentials';
                updateBtn.disabled = false;
            });
        });
    }

    // ─── GitHub API Integration ──────────────────────────────────────
    const GH_STORAGE_KEY = 'portfolio_gh_settings';

    function getGhSettings() {
        try {
            return JSON.parse(localStorage.getItem(GH_STORAGE_KEY)) || {};
        } catch { return {}; }
    }

    function saveGhSettings(settings) {
        localStorage.setItem(GH_STORAGE_KEY, JSON.stringify(settings));
    }

    function setGithubStatusBadge(connected) {
        const statusEl = document.getElementById('githubIntegrationStatus');
        if (!statusEl) return;
        if (connected) {
            statusEl.innerHTML = `
                <div class="gh-status-badge gh-connected">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    GitHub connected — Save will commit directly to your repository
                </div>`;
        } else {
            statusEl.innerHTML = '';
        }
    }

    // Populate fields from localStorage on load
    function loadGhSettingsUI() {
        const s = getGhSettings();
        const ownerEl = document.getElementById('githubOwner');
        const repoEl  = document.getElementById('githubRepo');
        const tokenEl = document.getElementById('githubToken');
        if (ownerEl && s.owner) ownerEl.value = s.owner;
        if (repoEl  && s.repo)  repoEl.value  = s.repo;
        if (tokenEl && s.token) tokenEl.value  = s.token;
        if (s.owner && s.repo && s.token) {
            setGithubStatusBadge(true);
            // Update server banner to show GitHub mode
            refreshServerBanner();
        }
    }

    function refreshServerBanner() {
        const s = getGhSettings();
        const hasGitHub = !!(s.owner && s.repo && s.token);
        if (!isServerAvailable && hasGitHub) {
            const banner = document.getElementById('server-mode-banner');
            if (banner) {
                banner.className = 'server-banner server-github';
                banner.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    <strong>GitHub Mode</strong> — Save will commit directly to <code>${s.owner}/${s.repo}</code> and trigger a Pages rebuild.
                `;
                // Re-enable save button in GitHub mode
                const saveBtn = document.getElementById('saveBtn');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.title = '';
                }
            }
        }
    }

    // Save via GitHub Contents API
    async function saveViaGitHub(jsonData) {
        const s = getGhSettings();
        if (!s.owner || !s.repo || !s.token) {
            throw new Error('GitHub settings not configured');
        }

        const apiBase = `https://api.github.com/repos/${s.owner}/${s.repo}/contents/data.json`;
        const headers = {
            'Authorization': `Bearer ${s.token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };

        // Step 1: Get current file SHA (required for update)
        const getRes = await fetch(apiBase, { headers });
        let sha = null;
        if (getRes.ok) {
            const fileInfo = await getRes.json();
            sha = fileInfo.sha;
        } else if (getRes.status !== 404) {
            const err = await getRes.json();
            throw new Error(err.message || 'Failed to fetch file info from GitHub');
        }

        // Step 2: Encode content as base64
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(jsonData, null, 2))));

        // Step 3: Commit the new content
        const body = {
            message: 'Update portfolio data via admin panel',
            content,
            ...(sha ? { sha } : {})
        };

        const putRes = await fetch(apiBase, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!putRes.ok) {
            const err = await putRes.json();
            throw new Error(err.message || 'GitHub commit failed');
        }

        return await putRes.json();
    }

    // Wire up settings buttons
    const saveGhBtn   = document.getElementById('saveGithubSettingsBtn');
    const testGhBtn   = document.getElementById('testGithubConnectionBtn');
    const clearGhBtn  = document.getElementById('clearGithubSettingsBtn');
    const toggleToken = document.getElementById('toggleTokenVisibility');

    if (toggleToken) {
        toggleToken.addEventListener('click', () => {
            const inp = document.getElementById('githubToken');
            if (inp.type === 'password') {
                inp.type = 'text';
                toggleToken.title = 'Hide token';
            } else {
                inp.type = 'password';
                toggleToken.title = 'Show token';
            }
        });
    }

    if (saveGhBtn) {
        saveGhBtn.addEventListener('click', () => {
            const owner = document.getElementById('githubOwner').value.trim();
            const repo  = document.getElementById('githubRepo').value.trim();
            const token = document.getElementById('githubToken').value.trim();

            if (!owner || !repo || !token) {
                showToast('Please fill in all three GitHub fields.', 'error');
                return;
            }

            saveGhSettings({ owner, repo, token });
            setGithubStatusBadge(true);
            refreshServerBanner();
            showToast('GitHub settings saved to browser. You can now save from GitHub Pages!', 'success');
        });
    }

    if (testGhBtn) {
        testGhBtn.addEventListener('click', async () => {
            const owner = document.getElementById('githubOwner').value.trim();
            const repo  = document.getElementById('githubRepo').value.trim();
            const token = document.getElementById('githubToken').value.trim();

            if (!owner || !repo || !token) {
                showToast('Fill in all GitHub fields before testing.', 'error');
                return;
            }

            testGhBtn.textContent = 'Testing...';
            testGhBtn.disabled = true;

            try {
                const res = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/contents/data.json`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github+json'
                        }
                    }
                );
                if (res.ok) {
                    showToast('✅ Connection successful! Repository and token are valid.', 'success');
                    setGithubStatusBadge(true);
                } else if (res.status === 401) {
                    showToast('❌ Invalid token. Check your Personal Access Token.', 'error');
                } else if (res.status === 404) {
                    showToast('❌ Repository or file not found. Check owner/repo name.', 'error');
                } else {
                    showToast(`❌ GitHub API error: ${res.status}`, 'error');
                }
            } catch (e) {
                showToast('❌ Network error. Check your connection.', 'error');
            } finally {
                testGhBtn.textContent = 'Test Connection';
                testGhBtn.disabled = false;
            }
        });
    }

    if (clearGhBtn) {
        clearGhBtn.addEventListener('click', () => {
            localStorage.removeItem(GH_STORAGE_KEY);
            document.getElementById('githubOwner').value = '';
            document.getElementById('githubRepo').value = '';
            document.getElementById('githubToken').value = '';
            setGithubStatusBadge(false);
            showToast('GitHub settings cleared from browser.', 'info');
            // Re-show offline banner
            showServerBanner(false);
        });
    }

    // Load GitHub settings into UI on startup
    loadGhSettingsUI();

    // ─── Gemini API / AI Assistant Settings ──────────────────────────────
    async function analyzeCertificateFile(file, cardEl, certObj) {
        const titleInput  = cardEl.querySelector('.cert-title');
        const issuerInput = cardEl.querySelector('.cert-issuer');
        const dateInput   = cardEl.querySelector('.cert-date');

        const originalTitle = titleInput.value;
        titleInput.value = 'AI Analyzing... ⏳';
        titleInput.disabled = true;
        issuerInput.disabled = true;
        dateInput.disabled = true;

        try {
            const reader = new FileReader();
            const base64Promise = new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
            });
            reader.readAsDataURL(file);
            const base64Data = await base64Promise;

            let result = null;

            if (isServerAvailable) {
                // Server mode
                const res = await fetch('/api/analyze-certificate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64: base64Data, mimeType: file.type })
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Server analysis failed');
                }
                result = await res.json();
            } else {
                // Static GitHub Pages mode (Direct API call from browser)
                const apiKey = localStorage.getItem('portfolio_gemini_key');
                if (!apiKey) {
                    throw new Error('Gemini API Key is not configured. Setup key in Settings first.');
                }
                
                const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
                const body = {
                    contents: [{
                        parts: [
                            { text: "Analyze this certificate image. Identify the certificate title (name of course/certification), issuer (issuing organization), and the year of completion. Return a JSON object with fields: 'title' (string, max 60 chars), 'issuer' (string, max 40 chars), 'date' (string, 4-digit year)." },
                            {
                                inlineData: {
                                    mimeType: file.type || 'image/jpeg',
                                    data: cleanBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                };

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (!res.ok) {
                    throw new Error('Gemini API direct call failed. Verify your API key.');
                }
                const data = await res.json();
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                    const textResult = data.candidates[0].content.parts[0].text;
                    result = JSON.parse(textResult.trim());
                } else {
                    throw new Error('Invalid response format from Gemini API');
                }
            }

            if (result && (result.title || result.issuer || result.date)) {
                if (result.title) {
                    certObj.title = result.title;
                    titleInput.value = result.title;
                }
                if (result.issuer) {
                    certObj.issuer = result.issuer;
                    issuerInput.value = result.issuer;
                }
                if (result.date) {
                    certObj.date = result.date;
                    dateInput.value = result.date;
                }
                showToast('✨ AI Autofill complete! Certificate identified successfully.', 'success');
            } else {
                throw new Error('No structured information returned');
            }
        } catch (err) {
            console.error('Autofill error:', err);
            titleInput.value = originalTitle;
            showToast(`AI Autofill failed: ${err.message}`, 'error');
        } finally {
            titleInput.disabled = false;
            issuerInput.disabled = false;
            dateInput.disabled = false;
        }
    }

    // AI Form wiring
    const aiForm = document.getElementById('aiSettingsForm');
    if (aiForm) {
        const localKeyKey = 'portfolio_gemini_key';
        
        const loadAiSettings = async () => {
            if (isServerAvailable) {
                try {
                    const res = await fetch('/api/settings/ai');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.hasKey) {
                            document.getElementById('geminiApiKeyInput').value = '••••••••••••••••••••';
                        }
                    }
                } catch (e) {}
            } else {
                const key = localStorage.getItem(localKeyKey);
                if (key) {
                    document.getElementById('geminiApiKeyInput').value = key;
                }
            }
        };

        // Call load
        setTimeout(loadAiSettings, 1000);

        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const keyVal = document.getElementById('geminiApiKeyInput').value.trim();

            if (!keyVal) {
                showToast('API Key cannot be empty.', 'error');
                return;
            }

            const saveBtn = document.getElementById('saveAiSettingsBtn');
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            try {
                if (isServerAvailable) {
                    const res = await fetch('/api/settings/ai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ geminiApiKey: keyVal })
                    });
                    if (!res.ok) throw new Error('Failed to save on server');
                    showToast('AI Settings updated successfully on server.', 'success');
                } else {
                    localStorage.setItem(localKeyKey, keyVal);
                    showToast('AI Settings saved to browser localStorage.', 'success');
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                saveBtn.textContent = 'Save AI Settings';
                saveBtn.disabled = false;
            }
        });

        const clearBtn = document.getElementById('clearAiSettingsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                document.getElementById('geminiApiKeyInput').value = '';
                if (isServerAvailable) {
                    try {
                        await fetch('/api/settings/ai', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ geminiApiKey: '' })
                        });
                    } catch(e){}
                } else {
                    localStorage.removeItem(localKeyKey);
                }
                showToast('AI API Key cleared.', 'info');
            });
        }

        const toggleBtn = document.getElementById('toggleGeminiKeyVisibility');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const inp = document.getElementById('geminiApiKeyInput');
                if (inp.type === 'password') {
                    inp.type = 'text';
                    toggleBtn.title = 'Hide key';
                } else {
                    inp.type = 'password';
                    toggleBtn.title = 'Show key';
                }
            });
        }
    }
});

