import React from 'react';
import {beforeEach,test,expect,jest} from '@jest/globals';
import type {Mock as JestMock} from 'jest-mock';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import MedicalRecordForm from './MedicalRecordForm';
type Mock=JestMock<any,any[]>;
const save=jest.fn();const initial={id:'r1',date:'2026-10-10T10:30',currentCondition:'',treatmentPlan:'',notes:''};
beforeEach(()=>{(save as Mock).mockResolvedValue(undefined);});
const open=()=>render(<MedicalRecordForm initialData={initial} onSubmit={save as any}/>);
const tab=(name:string)=>fireEvent.click(screen.getByRole('tab',{name:new RegExp(name)}));
const fillRequired=()=>{tab('評価・所見');fireEvent.change(screen.getByLabelText(/現症・観察所見/),{target:{value:'ROM 120°、MMT 4/5、左肩挙上時痛'}});tab('方針・経過');fireEvent.change(screen.getByLabelText(/治療・施術方針/),{target:{value:'施術後の反応を再評価する'}});};
test('分類を切り替えても入力を保持し、英数・記号・疼痛0と空の任意数値を保存できる',async()=>{
  open();fireEvent.change(screen.getByLabelText('主訴'),{target:{value:'左肩痛'}});fireEvent.change(screen.getByLabelText('痛みの程度（NRS 0〜10）'),{target:{value:'0'}});
  fillRequired();tab('問診・症状');expect((screen.getByLabelText('主訴') as HTMLTextAreaElement).value).toBe('左肩痛');
  fireEvent.click(screen.getByRole('button',{name:'診療記録を保存'}));
  await waitFor(()=>expect(save).toHaveBeenCalledTimes(1));
  const data=(save as Mock).mock.calls[0][0];expect(data).toMatchObject({chiefComplaint:'左肩痛',painSeverity:0,currentCondition:'ROM 120°、MMT 4/5、左肩挙上時痛'});
  expect(data.acupunctureCount).toBeUndefined();expect(data.vitalSigns.pulse).toBeUndefined();
});
test('必須項目に不備がある分類を表示し、保存しない',async()=>{
  open();fireEvent.click(screen.getByRole('button',{name:'診療記録を保存'}));
  await waitFor(()=>expect(screen.getByRole('tab',{name:/評価・所見/}).getAttribute('aria-selected')).toBe('true'));
  expect(save).not.toHaveBeenCalled();expect(document.activeElement).toBe(screen.getByLabelText(/現症・観察所見/));
});
test('保存失敗後も入力と添付を保持して再送できる',async()=>{
  (save as Mock).mockRejectedValueOnce(new Error('接続失敗'));open();fillRequired();
  const file=new File(['test'],'test.pdf',{type:'application/pdf'});fireEvent.change(screen.getByLabelText('画像・動画・PDFを追加'),{target:{files:[file]}});
  fireEvent.click(screen.getByRole('button',{name:'診療記録を保存'}));
  expect((await screen.findByRole('alert')).textContent).toContain('入力内容は保持');expect((save as Mock).mock.calls[0][1]).toEqual([file]);
  expect((screen.getByLabelText(/治療・施術方針/) as HTMLTextAreaElement).value).toBe('施術後の反応を再評価する');
  fireEvent.click(screen.getByRole('button',{name:'診療記録を保存'}));await waitFor(()=>expect(save).toHaveBeenCalledTimes(2));
});
