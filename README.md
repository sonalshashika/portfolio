# Portfolio Control Panel

This repository includes a control panel that allows you to easily edit the content of the portfolio without directly modifying code.

## Running the Server Locally

To use the control panel, you must start the local backend server.

1.  Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
2.  Open your terminal in the root directory of this project.
3.  Start the server:

    ```bash
    node server.js
    ```

    *On the first run, the server will automatically generate a `.env` file with a secure random password and print it to your console.*

## Accessing the Control Panel

1.  Navigate to the main site at [http://localhost:8000](http://localhost:8000).
2.  To access the control panel, go to [http://localhost:8000/admin.html](http://localhost:8000/admin.html).
3.  When prompted for credentials, use the username **`admin`** and the password that was generated in your console (or check the `.env` file).

## Saving Changes

Changes made in the control panel will be saved directly to the `data.json` file. Ensure you commit these changes (`git add data.json && git commit -m "Update content" && git push`) to your Git repository to deploy them to your live website (e.g. GitHub Pages). The live site will automatically load the new content.