import React, { useContext } from 'react';
import FormContext from '../store/form-context';
import classes from "../css/PaginateBar.module.css";

function PaginateBar() {
  const {setCurrentPage, page, numOfPages, validate, validation} = useContext(FormContext);
  const buttonEl = [];
  
  const stepLabels = ['Cá nhân', 'Chuyên môn', 'Ứng tuyển', 'Xem lại'];

  for(let i=1; i<=numOfPages;i++) {
    const isDone    = i < page;
    const isCurrent = i === page;
    const isLocked  = (i === numOfPages && validate(validation) === false);
    buttonEl.push(
      <div key={i} className={classes.stepWrapper}>
        <button
          className={`${classes.circularButton} ${isDone ? classes.visited : ''} ${isCurrent ? classes.current : ''}`}
          onClick={() => setCurrentPage(i)}
          disabled={isLocked}
          title={stepLabels[i-1]}
        >
          {isDone
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : i
          }
        </button>
        <span className={`${classes.stepLabel} ${isCurrent ? classes.activeLabel : ''} ${isDone ? classes.doneLabel : ''}`}>
          {stepLabels[i-1]}
        </span>
      </div>
    );
  }

  
  return (
    <div className={classes.outerContainer}>
      <div className={classes.buttonContainer}>
        {buttonEl}
      </div>
      <progress className={classes.progressBar} max={100} value={page===1?'20':page===2?'50':page===3?'80':'100'}/>
    </div>
  )
}

export default PaginateBar