
export const progression = (() => {
    class ProgressionManager {
        constructor() {
            this.progress_ = 0.0;
        }

        Update(timeElapsed) {
            this.UpdateProgression_(timeElapsed);
        }

        //Progression 
        UpdateProgression_(timeElapsed) {
            this.progress_ += timeElapsed * 10.0;

            const scoreText = (Math.round((this.progress_ * 10) / 10)).toLocaleString(
                'en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 5;
                
            document.getElementById('runner').style.left = scoreText * 4.1 + 'px';

            if (this.progress_ >= 500) {
                document.dispatchEvent(new CustomEvent('score-over'));
            }
        }
    }

    return {
        ProgressionManager: ProgressionManager,
    };
})();