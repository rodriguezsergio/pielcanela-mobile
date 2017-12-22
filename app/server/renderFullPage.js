export default function renderFullPage(html, schedule, dateString) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Piel Canela Schedule</title>
            <link rel="stylesheet" href="/assets/main.css" />
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.6.1/css/bulma.min.css">
        </head>
        <body>
            <div id="root">${html}</div>
            <script>
            window.schedule = ${JSON.stringify(schedule).replace(/</g, '\\u003c')}
            window.dateString = ${JSON.stringify(dateString).replace(/</g, '\\u003c')}
            </script>
            <script src="/assets/client.js"></script>
        </body>
        </html>
    `;
}
