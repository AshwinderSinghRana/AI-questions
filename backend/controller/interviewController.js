import intSchema from "../model/interviewSchema.js";


export const createInterviewConfig = async (req, res) => {
    try {
        const { level, type, jobRole } = req.body;

        const config = new intSchema({
            userId: req.user._id,
            level,
            type,
            jobRole,
        });

        const savedConfig = await config.save();
        return res.json({
            success: false,
            status: 200,
            message: "interview ",
            body: savedConfig
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating interview config' });
    }
};
