# TCGID.IO

A React application for managing trading card inventory and eBay listings.

## Create Batch Page

The Create Batch page (`/create-batch`) allows users to create inventory items in batches by uploading a zip file containing photos. This page provides an intuitive interface for batch processing of inventory items that will be created via the eBay API.

### Features

- **File Upload Component**: 
  - Accepts only `.zip` files
  - Supports drag-and-drop functionality
  - Visual feedback for drag-over states
  - File validation and error handling
  - Displays selected file name and size

- **Batch Configuration**:
  - **Batch Name**: Text field for users to enter a custom name for their batch
  - **Photos Per Listing**: Dropdown selector allowing users to choose how many photos should be grouped per listing (1-12 photos)
  - **Group By**: Radio selector to choose grouping method:
    - **Filename** (default): Groups photos by their filenames
    - **Creation Date**: Groups photos by their creation timestamps

- **Form Actions**:
  - **Create Batch Button**: Submits the form (currently disabled until backend endpoints are implemented)
  - **Reset Button**: Clears all form fields and resets to default values

- **User Instructions**: 
  - Clear, step-by-step instructions displayed at the top of the page
  - Explains the batch creation process and what happens after upload

### Responsive Design

The page is fully responsive with breakpoints optimized for:
- **Desktop** (md and up): Full-width layout with comfortable spacing
- **Tablet** (sm): Adjusted padding and layout for medium screens
- **Mobile** (xs): Stacked layout, full-width buttons, optimized touch targets

### Technical Details

- **Authentication**: The page requires user authentication and redirects to sign-in if not authenticated
- **File Validation**: Only `.zip` files are accepted; other file types show an error message
- **Form Validation**: 
  - Batch name is required
  - File selection is required
  - Submit button is disabled until all required fields are filled

### Backend Integration (Planned)

When backend endpoints are implemented, the page will:
1. Call an endpoint to retrieve a batch name and presigned URL for upload
2. Upload the zip file to the presigned URL
3. Trigger a backend job that:
   - Unzips the uploaded file
   - Groups photos according to user selections (number per listing and grouping method)
   - Initializes eBay listings for each group of photos

### File Location

- Component: `src/pages/CreateBatch.jsx`
- Route: `/create-batch`

