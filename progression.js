
export const progression = (() => {
    class ProgressionManager {
        constructor() {
            this.progress_ = 0.0;
            this.stamina_ = 100;
        }

        Update(timeElapsed) {
            this.UpdateStamina_(timeElapsed);
            this.UpdateProgression_(timeElapsed);
        }

        //Progression + Stamina
        UpdateProgression_(timeElapsed) {
            this.progress_ += timeElapsed * 10.0;

            const scoreText = (Math.round((this.progress_ * 10) / 10)).toLocaleString(
                'en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 5;
                
            document.getElementById('runner').style.left = scoreText * 4.1 + 'px';

            if (this.progress_ >= 500) {
                document.dispatchEvent(new CustomEvent('score-over'));
            }
        }

        UpdateStamina_(timeElapsed) {
            this.stamina_ -= timeElapsed * 5
            const staminaText = (Math.round(this.stamina_ * 10) / 10).toLocaleString(
                'en-US', { minimumIntegerDigits: 3, useGrouping: false });

            document.getElementById("stamina").style.width = staminaText + "%"
            if (this.stamina_ <= 0) {
                this.gameOver = true
            }
        }
    }

    return {
        ProgressionManager: ProgressionManager,
    };
})();