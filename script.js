const PIPEDRIVE_CONFIG = {
    API_TOKEN: '1958537ee49efd00afb5bb5b1a1adfc8ede849ca',
    BASE_URL: 'https://api.pipedrive.com/v1'
};

document.getElementById('serviceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const messages = document.getElementById('messages');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    loading.style.display = 'block';
    messages.innerHTML = '';
    
    const formData = new FormData(this);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    try {
        const result = await submitToPipedrive(data);
        
        messages.innerHTML = `
            <div class="success-message">
                <strong>Success!</strong> Your service request has been submitted successfully. 
                Deal ID: ${result.dealId} | Person ID: ${result.personId}
                <br>You will receive a confirmation email shortly.
                ${result.noteStatus ? `<br><small>Notes: ${result.noteStatus}</small>` : ''}
            </div>
        `;
        
        this.reset();
        
    } catch (error) {
        // Show error message
        messages.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${error.message}
                <br>Please try again or contact support if the issue persists.
            </div>
        `;
        console.error('Submission error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Service Request';
        loading.style.display = 'none';
        
        messages.scrollIntoView({ behavior: 'smooth' });
    }
});

async function submitToPipedrive(data) {
    const { API_TOKEN, BASE_URL } = PIPEDRIVE_CONFIG;
    
    try {
        const personPayload = {
            name: `${data.firstName} ${data.lastName}`,
            phone: [{ value: data.phone, primary: true }]
        };
        
        if (data.email && data.email.trim() !== '') {
            personPayload.email = [{ value: data.email, primary: true }];
        }
        
        console.log('Creating person with payload:', personPayload);
        
        const personResponse = await fetch(`${BASE_URL}/persons?api_token=${API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personPayload)
        });
        
        if (!personResponse.ok) {
            const errorData = await personResponse.json();
            throw new Error(`Failed to create person: ${errorData.error || 'Unknown error'}`);
        }
        
        const personData = await personResponse.json();
        const personId = personData.data.id;
        console.log('Person created successfully:', personId);
        
        const dealTitle = `${data.jobType || 'Service'} - ${data.firstName} ${data.lastName} (${data.city || 'Location TBD'})`;
        
        const dealPayload = {
            title: dealTitle,
            person_id: personId,
            value: 20000,
            currency: 'KZT'
        };
        
        console.log('Creating deal with payload:', dealPayload);
        
        const dealResponse = await fetch(`${BASE_URL}/deals?api_token=${API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dealPayload)
        });
        
        if (!dealResponse.ok) {
            const errorData = await dealResponse.json();
            throw new Error(`Failed to create deal: ${errorData.error || 'Unknown error'}`);
        }
        
        const dealData = await dealResponse.json();
        const dealId = dealData.data.id;
        console.log('Deal created successfully:', dealId);
        
        let noteStatus = 'Failed to add notes';
        
        try {
            const notes = createDealNotes(data);
            const noteResult = await addNotesToDeal(dealId, notes, API_TOKEN, BASE_URL);
            noteStatus = 'Notes added successfully';
            console.log('Notes added successfully:', noteResult);
        } catch (noteError) {
            console.warn('All note methods failed:', noteError);
            noteStatus = `Note creation failed: ${noteError.message}`;
        }
        
        return {
            success: true,
            personId: personId,
            dealId: dealId,
            dealTitle: dealTitle,
            noteStatus: noteStatus
        };
        
    } catch (error) {
        console.error('Pipedrive API Error:', error);
        throw new Error(`Pipedrive integration failed: ${error.message}`);
    }
}

async function addNotesToDeal(dealId, notes, apiToken, baseUrl) {
    console.log('Attempting to add notes to deal:', dealId);
    
    try {
        const notePayload = {
            content: notes,
            deal_id: parseInt(dealId)
        };
        
        console.log('Trying notes API with payload:', notePayload);
        
        const noteResponse = await fetch(`${baseUrl}/notes?api_token=${apiToken}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notePayload)
        });
        
        if (noteResponse.ok) {
            const noteResult = await noteResponse.json();
            console.log('Notes API success:', noteResult);
            return noteResult;
        }
        
        const noteError = await noteResponse.json();
        console.warn('Notes API failed:', noteError);
        throw new Error(`Notes API failed: ${JSON.stringify(noteError)}`);
        
    } catch (noteError) {
        console.warn('Notes method failed, trying activity method...');
        
        try {
            const activityPayload = {
                subject: 'Service Request Details',
                note: notes,
                deal_id: parseInt(dealId),
                type: 'task',
                done: 0
            };
            
            console.log('Trying activities API with payload:', activityPayload);
            
            const activityResponse = await fetch(`${baseUrl}/activities?api_token=${apiToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activityPayload)
            });
            
            if (activityResponse.ok) {
                const activityResult = await activityResponse.json();
                console.log('Activities API success:', activityResult);
                return activityResult;
            }
            
            const activityError = await activityResponse.json();
            console.warn('Activities API failed:', activityError);
            throw new Error(`Activities API failed: ${JSON.stringify(activityError)}`);
            
        } catch (activityError) {
            console.warn('Activity method failed, trying deal update...');
            
            try {
                const dealUpdatePayload = {
                    notes: notes.substring(0, 255)
                };
                
                console.log('Trying deal update with payload:', dealUpdatePayload);
                
                const dealUpdateResponse = await fetch(`${baseUrl}/deals/${dealId}?api_token=${apiToken}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dealUpdatePayload)
                });
                
                if (dealUpdateResponse.ok) {
                    const dealUpdateResult = await dealUpdateResponse.json();
                    console.log('Deal update success:', dealUpdateResult);
                    return dealUpdateResult;
                }
                
                const dealUpdateError = await dealUpdateResponse.json();
                console.warn('Deal update failed:', dealUpdateError);
                throw new Error(`Deal update failed: ${JSON.stringify(dealUpdateError)}`);
                
            } catch (dealUpdateError) {
                console.error('All note methods failed:', dealUpdateError);
                throw new Error('All note creation methods failed - deal created but no notes added');
            }
        }
    }
}

function createDealNotes(data) {
    const notes = [];
    
    notes.push('=== SERVICE REQUEST DETAILS ===');
    notes.push(`Job Type: ${data.jobType || 'Not specified'}`);
    notes.push(`Job Source: ${data.jobSource || 'Not specified'}`);
    
    if (data.jobDescription && data.jobDescription.trim() !== '') {
        notes.push(`Description: ${data.jobDescription}`);
    }
    
    notes.push('');
    notes.push('=== SERVICE LOCATION ===');
    notes.push(`Address: ${data.address || 'Not provided'}`);
    notes.push(`City: ${data.city || 'Not provided'}`);
    notes.push(`State: ${data.state || 'Not provided'}`);
    notes.push(`Zip Code: ${data.zipCode || 'Not provided'}`);
    
    if (data.area && data.area.trim() !== '') {
        notes.push(`Area: ${data.area}`);
    }
    
    notes.push('');
    notes.push('=== SCHEDULING ===');
    notes.push(`Start Date: ${data.startDate || 'Not scheduled'}`);
    
    if (data.startTime && data.startTime.trim() !== '') {
        notes.push(`Start Time: ${data.startTime}`);
    }
    
    if (data.endTime && data.endTime.trim() !== '') {
        notes.push(`End Time: ${data.endTime}`);
    }
    
    if (data.testSelect && data.testSelect.trim() !== '') {
        notes.push(`Priority Level: ${data.testSelect}`);
    }
    
    notes.push('');
    notes.push(`Created: ${new Date().toLocaleString()}`);
    notes.push('Generated by Service Request Form API');
    
    return notes.join('\n');
}

async function simulatePipedriveSubmission(data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) {
                console.log('Simulated submission - Data that would be sent to Pipedrive:', data);
                resolve({
                    success: true,
                    dealId: `DEMO-${Math.floor(Math.random() * 10000)}`,
                    personId: `DEMO-${Math.floor(Math.random() * 10000)}`
                });
            } else {
                reject(new Error('Simulated API error - please try again'));
            }
        }, 2000); 
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        startDateInput.min = new Date().toISOString().split('T')[0];
    }
    
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    
    if (startTimeInput && endTimeInput) {
        startTimeInput.addEventListener('change', function() {
            const startTime = this.value;
            if (startTime && !endTimeInput.value) {
                const [hours, minutes] = startTime.split(':');
                const endHours = String(Math.min(parseInt(hours) + 2, 23)).padStart(2, '0');
                endTimeInput.value = `${endHours}:${minutes}`;
            }
        });
    }

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
            }
            this.value = value;
        });
    }
    
    const requiredFields = document.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#e74c3c';
                this.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
            } else {
                this.style.borderColor = '#27ae60';
                this.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.1)';
            }
        });
        
        field.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = '#27ae60';
                this.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.1)';
            } else {
                this.style.borderColor = '#e9ecef';
                this.style.boxShadow = 'none';
            }
        });
    });
    
    const sections = document.querySelectorAll('.form-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateForm(data) {
    const errors = [];
    
    if (!data.firstName || data.firstName.trim() === '') {
        errors.push('First name is required');
    }
    
    if (!data.lastName || data.lastName.trim() === '') {
        errors.push('Last name is required');
    }
    
    if (!data.phone || data.phone.trim() === '') {
        errors.push('Phone number is required');
    }
    
    if (data.email && data.email.trim() !== '' && !isValidEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (data.startDate) {
        const selectedDate = new Date(data.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            errors.push('Start date cannot be in the past');
        }
    }
    
    return errors;
}