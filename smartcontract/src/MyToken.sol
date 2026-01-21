// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin-contracts-5.2.0/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin-contracts-5.2.0/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin-contracts-5.2.0/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin-contracts-5.2.0/utils/structs/EnumerableSet.sol";

contract MyToken is ERC20, ERC20Pausable, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private _allowlist;
    uint8 private _decimals;

    event AddressAllowlisted(address indexed account);
    event AddressRemovedFromAllowlist(address indexed account);

    error NotAllowlisted(address account);

    modifier onlyAllowlisted(address account) {
        if (!_allowlist.contains(account)) {
            revert NotAllowlisted(account);
        }
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
        _allowlist.add(msg.sender);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function addToAllowlist(address account) public onlyOwner {
        require(_allowlist.add(account), "Address already allowlisted");
        emit AddressAllowlisted(account);
    }

    function removeFromAllowlist(address account) public onlyOwner {
        require(_allowlist.remove(account), "Address not in allowlist");
        emit AddressRemovedFromAllowlist(account);
    }

    function isAllowlisted(address account) public view returns (bool) {
        return _allowlist.contains(account);
    }

    function getAllowlistLength() public view returns (uint256) {
        return _allowlist.length();
    }

    function getAllowlistAddress(uint256 index) public view returns (address) {
        return _allowlist.at(index);
    }

    function transfer(
        address to,
        uint256 value
    )
        public
        override
        onlyAllowlisted(msg.sender)
        onlyAllowlisted(to)
        returns (bool)
    {
        return super.transfer(to, value);
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    )
        public
        override
        onlyAllowlisted(msg.sender)
        onlyAllowlisted(from)
        onlyAllowlisted(to)
        returns (bool)
    {
        return super.transferFrom(from, to, value);
    }

    function approve(
        address spender,
        uint256 value
    )
        public
        override
        whenNotPaused
        onlyAllowlisted(msg.sender)
        onlyAllowlisted(spender)
        returns (bool)
    {
        return super.approve(spender, value);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public onlyAllowlisted(msg.sender) {
        _burn(msg.sender, amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
