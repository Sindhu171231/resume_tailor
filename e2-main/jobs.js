document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');

    const uploadBtn = document.getElementById('uploadBtn');
    const resumeUpload = document.getElementById('resumeUpload');
    const uploadStatus = document.getElementById('uploadStatus');
    const findJobsBtn = document.getElementById('findJobsBtn');
    const jobCards = document.getElementById('jobCards');

    // Fallback email for testing (replace with actual user email in production)
    const userEmail = localStorage.getItem('ai_resume_email') || 'test@example.com';
    console.log('Using email:', userEmail);

    uploadBtn.addEventListener('click', () => {
        console.log('Upload button clicked');
        resumeUpload.click();
    });

    resumeUpload.addEventListener('change', handleUpload);

    findJobsBtn.addEventListener('click', handleFindJobs);

    async function handleUpload(event) {
        console.log('Handling upload');
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        uploadStatus.textContent = 'Uploading resume...';
        uploadStatus.style.color = '#4a90e2';
        console.log('File selected:', file.name);

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('email', userEmail);

        try {
            console.log('Sending upload request to /resume/upload');
            const response = await fetch('http://localhost:4000/resume/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Upload response:', data);
            if (response.ok) {
                uploadStatus.textContent = 'Resume uploaded successfully!';
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.log('Upload error:', error.message);
            uploadStatus.textContent = `Error: ${error.message}`;
            uploadStatus.style.color = '#dc3545';
        }
    }

    async function handleFindJobs() {
        console.log('Find Jobs button clicked');
        jobCards.innerHTML = '';
        uploadStatus.textContent = 'Fetching jobs...';
        uploadStatus.style.color = '#4a90e2';

        try {
            console.log('Sending fetch request to /fetchJobs with email:', userEmail);
            const response = await fetch('http://localhost:4000/fetchJobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            const data = await response.json();
            console.log('Fetch jobs response:', data);
            if (response.ok) {
                uploadStatus.textContent = 'Jobs fetched successfully!';
                displayJobCards(data.alerts || []);
            } else {
                throw new Error(data.error || 'Fetch failed');
            }
        } catch (error) {
            console.log('Fetch jobs error:', error.message);
            uploadStatus.textContent = `Error: ${error.message}`;
            uploadStatus.style.color = '#dc3545';
        }
    }

    function displayJobCards(alerts) {
        console.log('Displaying job cards for alerts:', alerts);
        jobCards.innerHTML = '';
        alerts.forEach(alert => {
            alert.jobs.forEach(job => {
                const card = document.createElement('div');
                card.className = 'job-card';
                card.innerHTML = `
                    <h3>${job.title}</h3>
                    <p><strong>Company:</strong> ${job.company}</p>
                    <p><strong>Location:</strong> ${job.location}</p>
                    <a href="${job.link}" target="_blank">Apply Now</a>
                    ${job.salary ? `<p><strong>Salary:</strong> ${job.salary}</p>` : ''}
                `;
                jobCards.appendChild(card);
                console.log('Added job card:', job.title);
            });
        });
        if (jobCards.children.length === 0) {
            console.log('No jobs to display');
            jobCards.innerHTML = '<p style="text-align: center; color: #6c757d;">No jobs found.</p>';
        }
    }

    document.getElementById('logout').addEventListener('click', () => {
        console.log('Logout clicked');
        localStorage.removeItem('userEmail');
        alert('Logged out!');
        window.location.reload();
    });
});