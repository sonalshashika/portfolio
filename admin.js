document.addEventListener('DOMContentLoaded', () => {
    // Fetch data
    fetch('/api/content')
        .then(res => res.json())
        .then(data => {
            // Populate basic fields
            const fields = ['heroBadge', 'heroFirstName', 'heroLastName', 'heroTagline', 'aboutP1', 'aboutP2', 'aboutP3', 'stat1Value', 'stat1Label', 'stat2Value', 'stat2Label', 'stat3Value', 'stat3Label'];
            fields.forEach(field => {
                if (document.getElementById(field) && data[field] !== undefined) {
                    document.getElementById(field).value = data[field];
                }
            });

            // Populate JSON fields
            const jsonFields = ['experienceData', 'skillsData', 'projectsData'];
            jsonFields.forEach(field => {
                if (document.getElementById(field) && data[field] !== undefined) {
                    document.getElementById(field).value = JSON.stringify(data[field], null, 2);
                }
            });
        });

    // Save changes
    document.getElementById('saveBtn').addEventListener('click', () => {
        const data = {};

        // Collect basic fields
        const fields = ['heroBadge', 'heroFirstName', 'heroLastName', 'heroTagline', 'aboutP1', 'aboutP2', 'aboutP3', 'stat1Value', 'stat1Label', 'stat2Value', 'stat2Label', 'stat3Value', 'stat3Label'];
        fields.forEach(field => {
            data[field] = document.getElementById(field).value;
        });

        // Collect and parse JSON fields
        let hasError = false;
        const jsonFields = ['experienceData', 'skillsData', 'projectsData'];
        jsonFields.forEach(field => {
            try {
                data[field] = JSON.parse(document.getElementById(field).value);
            } catch (e) {
                alert(`Invalid JSON in ${field}`);
                hasError = true;
            }
        });

        if (hasError) return;

        // Post data
        fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (res.ok) {
                alert('Changes saved successfully!');
            } else {
                alert('Failed to save changes.');
            }
        });
    });
});
