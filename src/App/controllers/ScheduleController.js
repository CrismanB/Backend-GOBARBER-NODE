const Appointment = require("./../models/Appointment");
const dateFns = require("date-fns");
const { Op } = require("sequelize");
const User = require("./../models/User");
class ScheduleController {
    async index(req, res) {
        const checkUserProvider = await User.findOne({
            where: { id: req.userId, provider: true }
        });

        if (!checkUserProvider) {
            return res.status(401).json({ error: "User is not a provider" });
        }

        const { date } = req.query;
        const parseDate = dateFns.parseISO(date);

        const appointment = await Appointment.findAll({
            where: {
                provider_id: req.userId,
                canceled_at: null,
                date: {
                    [Op.between]: [
                        dateFns.startOfDay(parseDate),
                        dateFns.endOfDay(parseDate)
                    ]
                }
            },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name"]
                }
            ],
            order: ["date"]
        });

        return res.json(appointment);
    }
}

module.exports = new ScheduleController();
