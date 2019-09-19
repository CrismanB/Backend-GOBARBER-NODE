const Sequelize = require("sequelize");
const { Model } = require("sequelize");
const dateFns = require("date-fns");
class Appointment extends Model {
    static init(sequelize) {
        super.init(
            {
                date: Sequelize.DATE,
                canceled_at: Sequelize.DATE,
                past: {
                    type: Sequelize.VIRTUAL,
                    get() {
                        return dateFns.isBefore(this.date, new Date());
                    }
                },
                cancelable: {
                    type: Sequelize.VIRTUAL,
                    get() {
                        return dateFns.isBefore(
                            new Date(),
                            dateFns.subHours(this.date, 2)
                        );
                    }
                }
            },
            {
                sequelize
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
        this.belongsTo(models.User, {
            foreignKey: "provider_id",
            as: "provider"
        });
    }
}

module.exports = Appointment;
