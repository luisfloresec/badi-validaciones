import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentUploadDialog } from './document-upload-dialog';

describe('DocumentUploadDialog', () => {
  let component: DocumentUploadDialog;
  let fixture: ComponentFixture<DocumentUploadDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentUploadDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentUploadDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
