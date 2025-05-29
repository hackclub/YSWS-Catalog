# YSWS-Catalog

**YSWS-Catalog** is a web-based directory showcasing Hack Club’s "You Ship, We Ship" (YSWS) programs. Each YSWS program rewards participants for building and shipping projects—hardware, software, art, and more—by sending them physical or digital goodies. This repository hosts the source code for the catalog, allowing anyone to explore, filter, and learn about these initiatives. If you want to add or update a program, feel free to submit a pull request!

## Features

- **Dynamic Program Listing:** All YSWS programs are defined in `script.js` for easy editing.
- **Filtering by Status:** Quickly filter programs by `All`, `Active`, `Upcoming`, or `Completed`.
- **Search Functionality:** Easily search for programs by name, description, or Slack channel to find exactly what you're looking for.
- **Program Detail Modal:** Click on a program to view detailed information in a modal window, including participation steps and additional details.
- **Theme Toggle:** Switch between light and dark modes to suit your preference and improve accessibility.
- **Deadline Indicators:** Visual indicators for program deadlines, highlighting urgent and very urgent statuses to help prioritize participation.
- **Real-time Deadline Updates:** Deadlines are updated in real-time to reflect the current status, ensuring information is always up-to-date.
- **Responsive Design:** Optimized for various screen sizes and devices, providing a seamless experience on desktops, tablets, and mobile devices.
- **RSS Feed:** Subscribe to get notifications about active YSWS programs in your favorite RSS reader.
- **JSON API:** Get full data as a json object

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PawiX25/YSWS-Catalog.git
   cd YSWS-Catalog
   ```

2. **Open the catalog:**
   - Open `index.html` in your web browser.
   - Ensure `styles.css` and `script.js` are in the same directory.

3. **Filter Programs:**
   - Use the top buttons (`All`, `Active`, `Ending Soon`, `Upcoming`, `Completed`) to filter the displayed programs.

4. **Search Programs:**
   - Use the search bar to find programs by name, description, or Slack channel.

5. **Toggle Theme:**
   - Click the 🌙/☀️ button to switch between dark and light modes.

## RSS Feed

You can subscribe to updates about active YSWS programs using our RSS feed:

- **Feed URL**: `https://ysws.hackclub.com/feed.xml`

This feed is automatically updated whenever new programs are added or existing programs' statuses change. You can use this feed with any RSS reader like Feedly, Inoreader, or apps like Glance to get notified about new opportunities.

## Project Structure

- **index.html:** The main HTML file containing the container for program cards and the modal structure.
- **styles.css:** Styles for the layout, cards, typography, responsiveness, and theme toggling.
- **script.js:** Contains the programs data and logic for:
  - Rendering program cards
  - Counting active programs
  - Filtering by program status
  - Searching programs
  - Handling theme toggling
  - Managing program detail modals
  - Updating deadlines in real-time
- **generate-json.js:** Generates a JSON file equivalent of the data.yml (for API use)
- **generate-rss.js:** Generates an RSS feed.xml file

## Data Source & Example

All programs are defined in the `programs` object inside `script.js`. They are categorized into arrays such as `indefinite`, `limitedTime`, `upcoming`, `additional`, `noYouShip`, and `completed`.

Each program object can include:

- **Required Fields:**
  - `name`: Program name
  - `description`: Short description of the program
  - `status`: `active`, `upcoming`, or `completed`

- **Optional Fields:**
  - `website`: URL or `null`
  - `slack`: Slack channel URL or `null`
  - `slackChannel`: Slack channel name or `null`
  - `deadline`: When the program ends (for active/upcoming time-limited programs)
  - `ended`: When the program ended (for completed programs)
  - `opens`: When the program opens (for upcoming programs)
  - `detailedDescription`: A more detailed description for the modal view
  - `steps`: Custom participation steps
  - `requirements`: Array of requirements to participate
  - `details`: Array of additional details

### Real Example From This Repository

Below is an example from the `limitedTime` category in `data.yml`:

```yml
name: HackCraft
description: Create a Minecraft mod, and Hack Club sends you Minecraft Java!
website: https://hackcraft.hackclub.com/
slack: https://slack.com/archives/C07NQ5QAYNQ
slackChannel: "#mc-modding"
status: active
deadline: 2025-01-31T23:59:59
detailedDescription: Join HackCraft to build and ship your own Minecraft mod. Access exclusive resources and a supportive community.
steps:
   - Make a mod.
   - Publish it on Modrinth or Hangar.
   - Submit your mod to Hack Club.
   - Receive Minecraft Java Edition and enjoy!
requirements:
   - Basic knowledge of Java programming.
   - A passion for Minecraft modding.
details:
   - Participants will receive a Minecraft Java Edition account upon successful submission.
   - Support is available through our Slack community.
```

## Contributing

1. **Fork this repository.**
2. **Create a new branch** for your changes:
   ```bash
   git checkout -b add-new-program
   ```
3. **Add or update a program:**  
   Edit `script.js` and modify the `programs` object.
4. **Commit and push your changes:**
   ```bash
   git commit -m "Add a new YSWS program"
   git push origin add-new-program
   ```
5. **Open a Pull Request:**  
   On GitHub, open a PR from your fork to this repository and provide a description of your changes.
