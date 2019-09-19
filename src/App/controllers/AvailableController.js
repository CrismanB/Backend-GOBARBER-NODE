const dateFns = require("date-fns");
const Appointment = require("./../models/Appointment");
const { Op } = require("sequelize");

class AvailableController {
    async index(req, res) {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: "Invalid date." });
        }

        const searchDate = Number(date);

        const appointments = await Appointment.findAll({
            where: {
                provider_id: req.params.providerId,
                canceled_at: null,
                date: {
                    [Op.between]: [
                        dateFns.startOfDay(searchDate),
                        dateFns.endOfDay(searchDate)
                    ]
                }
            }
        });

        const schedule = [
            "08:00",
            "09:00",
            "10:00",
            "11:00",
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00",
            "18:00",
            "19:00"
        ];

        const available = schedule.map(time => {
            const [hour, minute] = time.split(":");
            const value = dateFns.setSeconds(
                dateFns.setMinutes(dateFns.setHours(searchDate, hour), 0),
                0
            );
            return {
                time,
                value: dateFns.format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
                available:
                    dateFns.isAfter(value, new Date()) &&
                    !appointments.find(
                        a => dateFns.format(a.date, "HH:mm") === time
                    )
            };
        });

        return res.json(available);
    }
}

module.exports = new AvailableController();
