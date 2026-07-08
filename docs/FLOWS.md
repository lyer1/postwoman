# Postwoman Flows

This document contains comprehensive Mermaid diagrams illustrating all user journeys, UI interactions, and core functional flows of the Postwoman application.

## 1. Application Initialization & Navigation Flow

```mermaid
stateDiagram-v2
    [*] --> AppLoaded
    AppLoaded --> FetchData: Components Mount
    
    state FetchData {
        [*] --> FetchCollections
        FetchCollections --> FetchHistory
        FetchHistory --> FetchEnvironments
    }

    FetchData --> SidebarRendered: Data successfully loaded
    
    state SidebarRendered {
        [*] --> ViewSidebarTabs
        ViewSidebarTabs --> CollectionsTab: Click 'Collections'
        ViewSidebarTabs --> HistoryTab: Click 'History'
        ViewSidebarTabs --> EnvironmentsTab: Click 'Environments'
    }
```

## 2. Tab & Workspace Management Flow

```mermaid
stateDiagram-v2
    [*] --> WorkspaceActive
    
    WorkspaceActive --> CreateNewTab: Click '+' in tab bar
    CreateNewTab --> EmptyRequestTabOpened
    
    WorkspaceActive --> OpenExistingRequest: Click request in Sidebar
    OpenExistingRequest --> CheckExistingTabs
    
    state CheckExistingTabs {
        [*] --> TabAlreadyOpen: Is req in tabs?
        [*] --> NewTab: Not in tabs
        TabAlreadyOpen --> SetActiveTab
        NewTab --> FetchRequestData --> AddTab --> SetActiveTab
    }
    
    WorkspaceActive --> CloseTab: Click 'x' on tab
    CloseTab --> RemoveFromState
    RemoveFromState --> FallbackToPreviousTab: If tabs remaining
    RemoveFromState --> EmptyWorkspace: If no tabs left
```

## 3. Collections & Requests Management Flow

```mermaid
stateDiagram-v2
    [*] --> CollectionsTabActive
    
    CollectionsTabActive --> CreateCollectionModal: Click '+' 
    CreateCollectionModal --> API_CreateCollection: Submit Name
    API_CreateCollection --> RefreshCollections
    
    CollectionsTabActive --> CollectionMenu: Click '⋮' on Collection
    state CollectionMenu {
        [*] --> RenameCollection
        [*] --> AddRequest
        [*] --> ExportCollection
        [*] --> DeleteCollection
    }
    
    AddRequest --> API_CreateRequest
    API_CreateRequest --> RequestRenderedInSidebar
    
    CollectionsTabActive --> RequestMenu: Click '⋮' on Request
    state RequestMenu {
        [*] --> DeleteRequest
    }
    DeleteRequest --> API_DeleteRequest
    API_DeleteRequest --> RefreshCollections
```

## 4. Environment Management Flow

```mermaid
stateDiagram-v2
    [*] --> EnvironmentsTabActive
    
    EnvironmentsTabActive --> CreateEnvironment: Click '+'
    CreateEnvironment --> EmptyEnvironmentCreated
    
    EnvironmentsTabActive --> EditEnvironment: Click on Environment
    
    state EditEnvironment {
        [*] --> RenameEnvironment: Edit Name
        [*] --> AddVariable: Enter Key/Value
        [*] --> ToggleVariable: Check/Uncheck Enable Box
        [*] --> DeleteVariable: Click Trash Icon
    }
    
    EditEnvironment --> AutoSaveEnvironment: Debounced API PUT
    AutoSaveEnvironment --> SyncActiveEnvironment: If currently active
    
    EnvironmentsTabActive --> SetActiveEnvironment: Click Checkmark
    SetActiveEnvironment --> GlobalStateUpdated: Injected into requests
```

## 5. Request Configuration and Execution Flow

```mermaid
stateDiagram-v2
    [*] --> RequestTabActive

    RequestTabActive --> InputURL
    RequestTabActive --> SelectMethod: GET/POST/PUT/etc.
    RequestTabActive --> ConfigureAuth: Basic/Bearer/None
    RequestTabActive --> ConfigureHeaders
    RequestTabActive --> ConfigureBody: Raw(JSON/Text) or Form-Data
    RequestTabActive --> ConfigureScripts: Pre-Request / Post-Response

    RequestTabActive --> ClickSend: Triggers execution

    state ExecutionPipeline {
        [*] --> ResolveVariables: Inject {{env_vars}}
        ResolveVariables --> RunPreRequestScript: Evaluate `pw.env.set`
        RunPreRequestScript --> BuildRequestPayload
        BuildRequestPayload --> ProxyBackend: POST `/api/proxy`
        ProxyBackend --> AwaitResponse
        AwaitResponse --> ParseResponse
        ParseResponse --> RunPostResponseScript: Evaluate `pw.expect`
    }

    ExecutionPipeline --> RenderResponse
    
    state RenderResponse {
        [*] --> ViewResponseBody: Syntax Highlighted
        [*] --> ViewResponseHeaders
        [*] --> ViewTestResults: Passes/Fails & Assertions
    }
```

## 6. Import, Export, and Code Generation Flow

```mermaid
stateDiagram-v2
    [*] --> AppIdle
    
    AppIdle --> ImportPostmanCollection: Click 'Import'
    ImportPostmanCollection --> SelectFile
    SelectFile --> ParseJSON
    ParseJSON --> API_BatchCreate: Send to backend
    API_BatchCreate --> RefreshCollections

    AppIdle --> ImportCurlModal: Click 'Import cURL'
    ImportCurlModal --> ParseCurlString
    ParseCurlString --> AddNewRequestTab
    
    AppIdle --> GenerateCodeSnippet: Click '</>' in Request
    state GenerateCodeSnippet {
        [*] --> ModalOpened
        ModalOpened --> SelectLanguage
        SelectLanguage --> RenderCurl: cURL
        SelectLanguage --> RenderFetch: JS Fetch
        SelectLanguage --> RenderPython: Python Requests
    }
    
    AppIdle --> ExportCollection: Click 'Export' in Collection Menu
    ExportCollection --> TransformToPostmanSchema: Map IDs and Arrays
    TransformToPostmanSchema --> TriggerBrowserDownload: Blob -> JSON File
```
