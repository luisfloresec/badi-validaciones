import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentDetailDialog } from './document-detail-dialog';

describe('DocumentDetailDialog', () => {
  let component: DocumentDetailDialog;
  let fixture: ComponentFixture<DocumentDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentDetailDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentDetailDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
