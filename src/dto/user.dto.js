// DTOs de usuario. su unica responsabilidad es decidir QUE campos salen de la api.
// el password no aparece en ninguna de estas listas: ni en texto plano ni hasheado.
// son whitelists a proposito: si mañana el modelo suma un campo interno, no se
// filtra solo por la respuesta, hay que agregarlo aca explicitamente.

// usuario completo: lo devuelven el registro, el login y el listado de admin.
// expone id (no _id) porque es el contrato que la api ya venia respetando.
export class UserDTO {
    constructor(user) {
        this.id = String(user._id ?? user.id);
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.email = user.email;
        this.role = user.role;
    }

    static from(user) {
        return user ? new UserDTO(user) : null;
    }

    static fromMany(users = []) {
        return users.map((user) => new UserDTO(user));
    }
}

// usuario de la sesion: lo minimo que viaja en el jwt y devuelve /current. no sale
// de la base sino del payload del token, por eso tiene su propia forma.
export class SessionUserDTO {
    constructor(user) {
        this.id = String(user.id ?? user._id);
        this.email = user.email;
        this.role = user.role;
    }

    static from(user) {
        return user ? new SessionUserDTO(user) : null;
    }
}

// usuario embebido dentro de otro documento: el organizer de un evento o el
// inscripto de un ticket. conserva _id porque asi lo devuelve populate y asi lo
// consumen los clientes.
//
// aca esta la parte importante del enunciado: cuando hay populate, el DTO tambien
// filtra el documento relacionado. aunque el DAO ya acote el select, el password
// de un tercero no puede salir ni por accidente.
export class UserRefDTO {
    constructor(user, { withRole = false } = {}) {
        this._id = String(user._id);
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.email = user.email;
        // el organizador de un evento se muestra con su rol; el inscripto de un
        // ticket no (a los demas inscriptos no les importa).
        if (withRole) this.role = user.role;
    }

    static from(user, options) {
        if (!user) return null;
        // sin populate mongoose deja el ObjectId pelado: no hay nada que filtrar,
        // se devuelve la referencia como string en vez de un objeto a medio llenar.
        if (user.first_name === undefined) return String(user);

        return new UserRefDTO(user, options);
    }
}
