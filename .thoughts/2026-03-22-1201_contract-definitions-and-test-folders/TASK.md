---
workflow_version: b0.5
title: "Task: Contract definitions and test folder relocation"
date: 2026-03-22
status: Draft
feature: "Contract definitions and test folder relocation"
language: en
rdpi-version: b0.5
---

## Task
1. Move tests in the core and react folders into __tests__ directories.
2. Add a method for creating dependency definitions with a specific contract. This should allow declaring dependency interfaces ahead of time and binding their implementations depending on the environment.

## Expected API Example
```ts
const ChatDataSource = inject.define<IChatDataSource>('ChatDataSource');

if (environment.IS_ELECTRON) {
  ChatDataSource.bind(ElectronChatDataSource);
} else {
  ChatDataSource.bind(CloudChatDataSource);
}

class ChatApi {
  private _ds = inject(ChatDataSource);

  getChatMessages = api.createResource({
    queryFn: this._ds.fetchChatMessages,
  });
}
```

## Assumption
The inject mechanism should not require additional changes beyond adding the define method.