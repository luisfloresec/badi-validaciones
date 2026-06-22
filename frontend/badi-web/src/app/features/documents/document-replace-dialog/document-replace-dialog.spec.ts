import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentReplaceDialog } from './document-replace-dialog';

describe('DocumentReplaceDialog', () => {
  let component: DocumentReplaceDialog;
  let fixture: ComponentFixture<DocumentReplaceDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentReplaceDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentReplaceDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
